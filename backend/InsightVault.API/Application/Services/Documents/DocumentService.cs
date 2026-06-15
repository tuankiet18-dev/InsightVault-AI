using System.Text.Json;
using InsightVault.API.Application.Abstractions.Messaging;
using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Abstractions.Services.Documents;
using InsightVault.API.Application.Abstractions.Services.Billing;
using InsightVault.API.Application.Abstractions.Services.Workspaces;
using InsightVault.API.Application.Abstractions.Storage;
using InsightVault.API.Application.Services.AiJobs;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.DTOs.AiJobs;
using InsightVault.API.DTOs.Common;
using InsightVault.API.DTOs.Documents;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using InsightVault.API.Application.Services.Billing;

namespace InsightVault.API.Application.Services.Documents;

public sealed class DocumentService(
    InsightVaultDbContext db,
    ICurrentUserService currentUserService,
    IWorkspacePermissionService workspacePermissionService,
    IDocumentRepository documentRepository,
    IFolderRepository folderRepository,
    IAiJobRepository aiJobRepository,
    IObjectStorageService objectStorageService,
    IMessagePublisher messagePublisher,
    ICreditService creditService,
    IWorkspaceEntitlementService entitlementService,
    IOptions<BillingOptions> billingOptions) : IDocumentService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private const long MaxInlineTextBytes = 5 * 1024 * 1024;
    private static readonly IReadOnlyDictionary<string, string> SupportedContentTypes = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = "application/pdf",
        [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        [".txt"] = "text/plain",
        [".md"] = "text/markdown"
    };

    public async Task<IReadOnlyList<DocumentDto>> ListByWorkspaceAsync(
        Guid workspaceId,
        Guid? folderId = null,
        string? status = null,
        string? q = null,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(workspaceId, userId, cancellationToken);

        if (folderId.HasValue)
        {
            await EnsureFolderExistsAsync(workspaceId, folderId.Value, cancellationToken);
        }

        var documentStatus = ParseStatus(status);
        var documents = await documentRepository.ListByWorkspaceAsync(
            workspaceId,
            folderId,
            documentStatus,
            cancellationToken);

        if (!string.IsNullOrWhiteSpace(q))
        {
            var searchTerm = q.Trim();
            documents = documents
                .Where(document => document.OriginalFileName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)
                    || document.FileName.Contains(searchTerm, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }

        return documents.Select(ToDocumentDto).ToList();
    }

    public async Task<DocumentDto> GetByIdAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var document = await GetActiveDocumentAsync(documentId, cancellationToken);
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(document.WorkspaceId, userId, cancellationToken);

        return ToDocumentDto(document);
    }

    public async Task<DocumentOriginalAccessResponse> GetOriginalAccessAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var document = await GetActiveDocumentAsync(documentId, cancellationToken);
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageDocumentsAsync(document.WorkspaceId, userId, cancellationToken);

        var storedObject = await objectStorageService.GetObjectMetadataAsync(
            document.MinioBucket,
            document.MinioObjectKey,
            cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status404NotFound,
                "document.original_not_found",
                "The original document file was not found in object storage.");

        var previewKind = GetOriginalPreviewKind(document);
        var presignedDownload = await objectStorageService.CreatePresignedDownloadAsync(
            new Application.Abstractions.Storage.PresignedDownloadRequest(
                document.MinioBucket,
                document.MinioObjectKey,
                objectStorageService.DefaultPresignedReadExpiry),
            cancellationToken);

        return new DocumentOriginalAccessResponse(
            document.OriginalFileName,
            storedObject.ContentType ?? document.MimeType ?? "application/octet-stream",
            previewKind,
            previewKind is "pdf" or "text",
            presignedDownload.DownloadUrl,
            presignedDownload.ExpiresAt);
    }

    public async Task<DocumentOriginalTextResponse> GetOriginalTextAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var document = await GetActiveDocumentAsync(documentId, cancellationToken);
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageDocumentsAsync(document.WorkspaceId, userId, cancellationToken);

        if (GetOriginalPreviewKind(document) != "text")
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "document.original_text_unsupported",
                "Only TXT and Markdown documents can be read as inline text.");
        }

        var storedObject = await objectStorageService.GetObjectMetadataAsync(
            document.MinioBucket,
            document.MinioObjectKey,
            cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status404NotFound,
                "document.original_not_found",
                "The original document file was not found in object storage.");

        if (storedObject.Size > MaxInlineTextBytes)
        {
            throw new ApiException(
                StatusCodes.Status413PayloadTooLarge,
                "document.original_text_too_large",
                "This text document is too large for inline preview. Download the original file instead.");
        }

        var content = await objectStorageService.ReadObjectAsTextAsync(
            document.MinioBucket,
            document.MinioObjectKey,
            cancellationToken);

        return new DocumentOriginalTextResponse(
            document.OriginalFileName,
            storedObject.ContentType ?? document.MimeType ?? "text/plain",
            content);
    }

    public async Task<DocumentDto> UpdateAsync(
        Guid documentId,
        UpdateDocumentRequest request,
        CancellationToken cancellationToken = default)
    {
        var document = await GetActiveDocumentAsync(documentId, cancellationToken);
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageDocumentsAsync(document.WorkspaceId, userId, cancellationToken);

        if (request.HasFolderId)
        {
            if (request.FolderId.HasValue)
            {
                await EnsureFolderExistsAsync(document.WorkspaceId, request.FolderId.Value, cancellationToken);
            }

            if (request.FolderId != document.FolderId)
            {
                if (await documentRepository.HasActiveFileNameAsync(
                        document.WorkspaceId,
                        request.FolderId,
                        document.FileName,
                        cancellationToken))
                {
                    throw new ApiException(
                        StatusCodes.Status409Conflict,
                        "document.filename_conflict",
                        "An active document with the same file name already exists in the destination folder.");
                }

                document.FolderId = request.FolderId;
                document.UpdatedAt = DateTimeOffset.UtcNow;
                await db.SaveChangesAsync(cancellationToken);
            }
        }

        return ToDocumentDto(document);
    }

    public async Task<IReadOnlyList<DocumentDto>> ListTrashByWorkspaceAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        var role = await GetTrashCapableRoleAsync(workspaceId, userId, cancellationToken);
        var uploadedById = role == WorkspaceRole.Editor ? userId : (Guid?)null;

        var documents = await documentRepository.ListDeletedByWorkspaceAsync(
            workspaceId,
            uploadedById,
            cancellationToken);

        return documents.Select(ToDocumentDto).ToList();
    }

    public async Task<PresignUploadResponse> CreatePresignedUploadAsync(
        Guid workspaceId,
        PresignUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageDocumentsAsync(workspaceId, userId, cancellationToken);

        var originalFileName = NormalizeFileName(request.FileName);
        var fileExtension = ValidateSupportedFile(originalFileName, request.ContentType);
        ValidateFileSize(request.FileSizeBytes);
        await entitlementService.EnsureCanStoreAsync(
            workspaceId,
            request.FileSizeBytes,
            cancellationToken);

        if (request.FolderId.HasValue)
        {
            await EnsureFolderExistsAsync(workspaceId, request.FolderId.Value, cancellationToken);
        }

        if (await documentRepository.HasActiveFileNameAsync(
                workspaceId,
                request.FolderId,
                originalFileName,
                cancellationToken))
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "document.filename_conflict",
                "An active document with the same file name already exists in this folder.");
        }

        var documentId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        var objectKey = CreateObjectKey(workspaceId, documentId, fileExtension);
        var document = new Document
        {
            Id = documentId,
            WorkspaceId = workspaceId,
            FolderId = request.FolderId,
            UploadedById = userId,
            FileName = originalFileName,
            OriginalFileName = originalFileName,
            FileType = fileExtension.TrimStart('.'),
            MimeType = request.ContentType.Trim(),
            FileSizeBytes = request.FileSizeBytes,
            MinioBucket = objectStorageService.DefaultBucketName,
            MinioObjectKey = objectKey,
            Status = DocumentStatus.PendingUpload,
            CreatedAt = now,
            UpdatedAt = now
        };

        var presignedUpload = await objectStorageService.CreatePresignedUploadAsync(
            new Application.Abstractions.Storage.PresignedUploadRequest(
                document.MinioBucket,
                document.MinioObjectKey,
                document.MimeType,
                objectStorageService.DefaultPresignedUploadExpiry),
            cancellationToken);

        await documentRepository.AddAsync(document, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return new PresignUploadResponse(
            document.Id,
            presignedUpload.UploadUrl,
            document.MinioObjectKey,
            presignedUpload.ExpiresAt,
            presignedUpload.RequiredHeaders);
    }

    public async Task<ConfirmUploadResponse> ConfirmUploadAsync(
        Guid documentId,
        ConfirmUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        var document = await GetActiveDocumentAsync(documentId, cancellationToken);
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageDocumentsAsync(document.WorkspaceId, userId, cancellationToken);
        await EnsureCanConfirmUploadAsync(document, userId, cancellationToken);

        if (document.Status != DocumentStatus.PendingUpload)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "document.invalid_status",
                "Only pending uploads can be confirmed.");
        }

        var storedObject = await objectStorageService.GetObjectMetadataAsync(
            document.MinioBucket,
            document.MinioObjectKey,
            cancellationToken);
        ValidateConfirmRequest(document, request, storedObject);

        document.Status = DocumentStatus.Uploaded;
        document.UpdatedAt = DateTimeOffset.UtcNow;

        var aiJob = CreateProcessDocumentJob(document, userId);
        var credits = BillingCreditCosts.ForDocument(document.FileSizeBytes, billingOptions.Value);
        await aiJobRepository.AddAsync(aiJob, cancellationToken);
        await creditService.ConsumeAsync(
            document.WorkspaceId,
            aiJob.Id,
            credits,
            "process_document",
            cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await PublishProcessingJobAsync(document, aiJob, cancellationToken);

        return new ConfirmUploadResponse(ToDocumentDto(document), ToAiJobDto(aiJob));
    }

    private async Task EnsureCanConfirmUploadAsync(
        Document document,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var role = await workspacePermissionService.GetUserRoleAsync(
            document.WorkspaceId,
            userId,
            cancellationToken);

        if (role == WorkspaceRole.Owner || document.UploadedById == userId)
        {
            return;
        }

        throw new ApiException(
            StatusCodes.Status403Forbidden,
            "document.confirm_forbidden",
            "Only the workspace owner or the user who started this upload can confirm it.");
    }

    public async Task DeleteAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var document = await GetActiveDocumentAsync(documentId, cancellationToken);
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanDeleteDocumentAsync(
            document.WorkspaceId,
            document.UploadedById,
            userId,
            cancellationToken);

        var now = DateTimeOffset.UtcNow;
        document.DeletedAt = now;
        document.UpdatedAt = now;

        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<DocumentDto> RestoreAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var document = await GetDeletedDocumentAsync(documentId, cancellationToken);
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanDeleteDocumentAsync(
            document.WorkspaceId,
            document.UploadedById,
            userId,
            cancellationToken);

        if (document.FolderId.HasValue)
        {
            await EnsureFolderExistsAsync(document.WorkspaceId, document.FolderId.Value, cancellationToken);
        }

        if (await documentRepository.HasActiveFileNameAsync(
                document.WorkspaceId,
                document.FolderId,
                document.FileName,
                cancellationToken))
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "document.filename_conflict",
                "An active document with the same file name already exists in this folder.");
        }

        document.DeletedAt = null;
        document.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return ToDocumentDto(document);
    }

    public async Task HardDeleteAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var document = await GetDeletedDocumentAsync(documentId, cancellationToken);
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanDeleteDocumentAsync(
            document.WorkspaceId,
            document.UploadedById,
            userId,
            cancellationToken);

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);

        documentRepository.Delete(document);
        await objectStorageService.DeleteObjectAsync(
            document.MinioBucket,
            document.MinioObjectKey,
            cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await transaction.CommitAsync(cancellationToken);
    }

    public async Task<ConfirmUploadResponse> RetryProcessingAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var document = await GetActiveDocumentAsync(documentId, cancellationToken);
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageDocumentsAsync(document.WorkspaceId, userId, cancellationToken);

        if (document.Status != DocumentStatus.Failed)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "document.invalid_status",
                "Only failed documents can be retried.");
        }

        document.Status = DocumentStatus.Uploaded;
        document.ProcessingError = null;
        document.UpdatedAt = DateTimeOffset.UtcNow;

        var aiJob = CreateProcessDocumentJob(document, userId);
        await aiJobRepository.AddAsync(aiJob, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await PublishProcessingJobAsync(document, aiJob, cancellationToken);

        return new ConfirmUploadResponse(ToDocumentDto(document), ToAiJobDto(aiJob));
    }

    private static DocumentStatus? ParseStatus(string? status)
    {
        if (string.IsNullOrWhiteSpace(status))
        {
            return null;
        }

        return status.Trim().ToLowerInvariant() switch
        {
            "pending_upload" => DocumentStatus.PendingUpload,
            "uploaded" => DocumentStatus.Uploaded,
            "processing" => DocumentStatus.Processing,
            "completed" => DocumentStatus.Completed,
            "failed" => DocumentStatus.Failed,
            _ => throw new ApiException(
                StatusCodes.Status400BadRequest,
                "document.invalid_status",
                "Document status is invalid.")
        };
    }

    private async Task<Document> GetActiveDocumentAsync(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        var document = await documentRepository.GetByIdAsync(documentId, cancellationToken);

        if (document is null || document.DeletedAt is not null)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "document.not_found",
                "Document not found.");
        }

        return document;
    }

    private async Task<Document> GetDeletedDocumentAsync(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        var document = await documentRepository.GetByIdAsync(documentId, cancellationToken);

        if (document is null)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "document.not_found",
                "Document not found.");
        }

        if (document.DeletedAt is null)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "document.not_in_trash",
                "Document is not in Trash.");
        }

        return document;
    }

    private async Task<WorkspaceRole> GetTrashCapableRoleAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(workspaceId, userId, cancellationToken);

        var role = await workspacePermissionService.GetUserRoleAsync(workspaceId, userId, cancellationToken);
        if (role is WorkspaceRole.Owner or WorkspaceRole.Editor)
        {
            return role.Value;
        }

        throw new ApiException(
            StatusCodes.Status403Forbidden,
            "workspace.insufficient_role",
            "Only workspace owners and editors can access document Trash.");
    }

    private async Task EnsureFolderExistsAsync(
        Guid workspaceId,
        Guid folderId,
        CancellationToken cancellationToken)
    {
        if (!await folderRepository.ExistsInWorkspaceAsync(folderId, workspaceId, cancellationToken))
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "folder.not_found",
                "Folder not found.");
        }
    }

    private static string NormalizeFileName(string fileName)
    {
        var normalizedFileName = Path.GetFileName(fileName.Trim());

        if (string.IsNullOrWhiteSpace(normalizedFileName))
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "document.invalid_file_name",
                "File name is required.");
        }

        return normalizedFileName;
    }

    private static string ValidateSupportedFile(string fileName, string contentType)
    {
        var extension = Path.GetExtension(fileName);

        if (string.IsNullOrWhiteSpace(extension)
            || !SupportedContentTypes.TryGetValue(extension, out var expectedContentType))
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "document.unsupported_file_type",
                "Only PDF, DOCX, TXT, and Markdown files are supported.");
        }

        if (!string.Equals(expectedContentType, contentType.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "document.invalid_content_type",
                "Content type does not match the file extension.");
        }

        return extension.ToLowerInvariant();
    }

    private static void ValidateFileSize(long fileSizeBytes)
    {
        const long maxFileSizeBytes = 25 * 1024 * 1024;

        if (fileSizeBytes <= 0)
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "document.invalid_file_size",
                "File size must be greater than zero.");
        }

        if (fileSizeBytes > maxFileSizeBytes)
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "document.file_too_large",
                "File size must be 25 MB or smaller.");
        }
    }

    private static void ValidateConfirmRequest(
        Document document,
        ConfirmUploadRequest request,
        StoredObjectMetadata? storedObject)
    {
        if (storedObject is null)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "document.object_not_found",
                "The uploaded object was not found in storage.");
        }

        ValidateFileSize(request.FileSizeBytes);

        if (document.FileSizeBytes != request.FileSizeBytes
            || storedObject.Size != document.FileSizeBytes)
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "document.file_size_mismatch",
                "Confirmed file size does not match the presigned upload request.");
        }

        if (!string.Equals(document.MimeType, request.ContentType.Trim(), StringComparison.OrdinalIgnoreCase)
            || !string.IsNullOrWhiteSpace(storedObject.ContentType)
            && !string.Equals(
                document.MimeType,
                storedObject.ContentType,
                StringComparison.OrdinalIgnoreCase))
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "document.content_type_mismatch",
                "Confirmed content type does not match the presigned upload request.");
        }
    }

    private Guid GetRequiredUserId()
    {
        return currentUserService.UserId
            ?? throw new ApiException(
                StatusCodes.Status401Unauthorized,
                "auth.unauthorized",
                "A valid authenticated user is required.");
    }

    private async Task PublishProcessingJobAsync(
        Document document,
        AiJob aiJob,
        CancellationToken cancellationToken)
    {
        try
        {
            await messagePublisher.PublishDocumentProcessingJobAsync(aiJob.Id, cancellationToken);
        }
        catch (Exception exception)
        {
            await creditService.RefundAsync(
                document.WorkspaceId,
                aiJob.Id,
                "process_document_queue_failure",
                CancellationToken.None);
            var now = DateTimeOffset.UtcNow;
            aiJob.Status = AiJobStatus.Failed;
            aiJob.ErrorMessage = $"Failed to publish processing job: {exception.Message}";
            aiJob.CompletedAt = now;
            aiJob.UpdatedAt = now;
            document.Status = DocumentStatus.Failed;
            document.ProcessingError = aiJob.ErrorMessage;
            document.UpdatedAt = now;
            await db.SaveChangesAsync(CancellationToken.None);

            throw new ApiException(
                StatusCodes.Status503ServiceUnavailable,
                "document.queue_unavailable",
                "The document was uploaded, but processing could not be queued. Retry processing later.");
        }
    }

    private static string CreateObjectKey(Guid workspaceId, Guid documentId, string fileExtension)
    {
        return $"workspaces/{workspaceId}/documents/{documentId}/original{fileExtension}";
    }

    private static string GetOriginalPreviewKind(Document document)
    {
        var extension = Path.GetExtension(document.OriginalFileName).ToLowerInvariant();

        return extension switch
        {
            ".pdf" => "pdf",
            ".txt" or ".md" => "text",
            _ => "download"
        };
    }

    private static AiJob CreateProcessDocumentJob(Document document, Guid userId)
    {
        var now = DateTimeOffset.UtcNow;
        var inputPayload = new
        {
            document_id = document.Id,
            workspace_id = document.WorkspaceId,
            folder_id = document.FolderId,
            minio_bucket = document.MinioBucket,
            minio_object_key = document.MinioObjectKey,
            file_name = document.OriginalFileName,
            file_type = document.FileType,
            mime_type = document.MimeType
        };

        return new AiJob
        {
            Id = Guid.NewGuid(),
            WorkspaceId = document.WorkspaceId,
            DocumentId = document.Id,
            CreatedById = userId,
            JobType = AiJobType.ProcessDocument,
            Status = AiJobStatus.Queued,
            InputPayload = JsonSerializer.Serialize(inputPayload, JsonOptions),
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private static DocumentDto ToDocumentDto(Document document)
    {
        return new DocumentDto(
            document.Id,
            document.WorkspaceId,
            document.FolderId,
            document.UploadedById,
            document.FileName,
            document.OriginalFileName,
            document.FileType,
            document.MimeType,
            document.FileSizeBytes,
            ToApiDocumentStatus(document.Status),
            document.DocumentType,
            document.DocumentTypeConfidence,
            document.AudienceFit,
            document.Summary,
            DeserializeStringList(document.KeyPoints),
            DeserializeInsights(document.Insights),
            DeserializeStringList(document.Keywords),
            document.ProcessingError,
            document.ProcessedAt,
            document.CreatedAt,
            document.UpdatedAt);
    }

    private static AiJobDto ToAiJobDto(AiJob aiJob)
    {
        return new AiJobDto(
            aiJob.Id,
            aiJob.WorkspaceId,
            aiJob.DocumentId,
            AiJobOutputPayload.GetReportId(aiJob),
            ToApiAiJobType(aiJob.JobType),
            ToApiAiJobStatus(aiJob.Status),
            aiJob.RetryCount,
            aiJob.ErrorMessage,
            aiJob.CreatedAt,
            aiJob.UpdatedAt);
    }

    private static IReadOnlyList<string> DeserializeStringList(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<IReadOnlyList<string>>(json, JsonOptions) ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static DocumentInsightsDto DeserializeInsights(string json)
    {
        try
        {
            var result = JsonSerializer.Deserialize<DocumentInsightsDto>(json, JsonOptions);
            return result ?? EmptyInsights();
        }
        catch (JsonException)
        {
            return EmptyInsights();
        }
    }

    private static DocumentInsightsDto EmptyInsights()
    {
        return new DocumentInsightsDto([], [], [], [], []);
    }

    private static ApiDocumentStatus ToApiDocumentStatus(DocumentStatus status)
    {
        return status switch
        {
            DocumentStatus.PendingUpload => ApiDocumentStatus.PendingUpload,
            DocumentStatus.Uploaded => ApiDocumentStatus.Uploaded,
            DocumentStatus.Processing => ApiDocumentStatus.Processing,
            DocumentStatus.Completed => ApiDocumentStatus.Completed,
            DocumentStatus.Failed => ApiDocumentStatus.Failed,
            _ => throw new ArgumentOutOfRangeException(nameof(status), status, null)
        };
    }

    private static ApiAiJobType ToApiAiJobType(AiJobType jobType)
    {
        return jobType switch
        {
            AiJobType.ProcessDocument => ApiAiJobType.ProcessDocument,
            AiJobType.GenerateSummary => ApiAiJobType.GenerateSummary,
            AiJobType.RagChat => ApiAiJobType.RagChat,
            AiJobType.GenerateReport => ApiAiJobType.GenerateReport,
            AiJobType.CompareDocuments => ApiAiJobType.CompareDocuments,
            _ => throw new ArgumentOutOfRangeException(nameof(jobType), jobType, null)
        };
    }

    private static ApiAiJobStatus ToApiAiJobStatus(AiJobStatus status)
    {
        return status switch
        {
            AiJobStatus.Queued => ApiAiJobStatus.Queued,
            AiJobStatus.Processing => ApiAiJobStatus.Processing,
            AiJobStatus.Completed => ApiAiJobStatus.Completed,
            AiJobStatus.Failed => ApiAiJobStatus.Failed,
            AiJobStatus.Cancelled => ApiAiJobStatus.Cancelled,
            _ => throw new ArgumentOutOfRangeException(nameof(status), status, null)
        };
    }
}
