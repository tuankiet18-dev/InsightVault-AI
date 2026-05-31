using System.Text.Json;
using InsightVault.API.Application.Abstractions.Auth;
using InsightVault.API.Application.Abstractions.Messaging;
using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Application.Abstractions.Services.Documents;
using InsightVault.API.Application.Abstractions.Storage;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.DTOs.AiJobs;
using InsightVault.API.DTOs.Common;
using InsightVault.API.DTOs.Documents;

namespace InsightVault.API.Application.Services.Documents;

public sealed class DocumentService(
    InsightVaultDbContext db,
    ICurrentUserService currentUserService,
    IWorkspacePermissionService workspacePermissionService,
    IDocumentRepository documentRepository,
    IFolderRepository folderRepository,
    IAiJobRepository aiJobRepository,
    IObjectStorageService objectStorageService,
    IMessagePublisher messagePublisher) : IDocumentService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
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
        var userId = currentUserService.GetRequiredUserId();
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
        var userId = currentUserService.GetRequiredUserId();
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(document.WorkspaceId, userId, cancellationToken);

        return ToDocumentDto(document);
    }

    public async Task<PresignUploadResponse> CreatePresignedUploadAsync(
        Guid workspaceId,
        PresignUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageDocumentsAsync(workspaceId, userId, cancellationToken);

        var originalFileName = NormalizeFileName(request.FileName);
        var fileExtension = ValidateSupportedFile(originalFileName, request.ContentType);
        ValidateFileSize(request.FileSizeBytes);

        if (request.FolderId.HasValue)
        {
            await EnsureFolderExistsAsync(workspaceId, request.FolderId.Value, cancellationToken);
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
        var userId = currentUserService.GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageDocumentsAsync(document.WorkspaceId, userId, cancellationToken);

        if (document.Status != DocumentStatus.PendingUpload)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "document.invalid_status",
                "Only pending uploads can be confirmed.");
        }

        ValidateConfirmRequest(document, request);

        document.Status = DocumentStatus.Uploaded;
        document.UpdatedAt = DateTimeOffset.UtcNow;

        var aiJob = CreateProcessDocumentJob(document, userId);
        await aiJobRepository.AddAsync(aiJob, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await messagePublisher.PublishDocumentProcessingJobAsync(aiJob.Id, cancellationToken);

        return new ConfirmUploadResponse(ToDocumentDto(document), ToAiJobDto(aiJob));
    }

    public async Task DeleteAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var document = await GetActiveDocumentAsync(documentId, cancellationToken);
        var userId = currentUserService.GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageDocumentsAsync(document.WorkspaceId, userId, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        document.DeletedAt = now;
        document.UpdatedAt = now;

        await objectStorageService.DeleteObjectIfExistsAsync(
            document.MinioBucket,
            document.MinioObjectKey,
            cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
    }

    public async Task<ConfirmUploadResponse> RetryProcessingAsync(
        Guid documentId,
        CancellationToken cancellationToken = default)
    {
        var document = await GetActiveDocumentAsync(documentId, cancellationToken);
        var userId = currentUserService.GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageDocumentsAsync(document.WorkspaceId, userId, cancellationToken);

        if (document.Status is DocumentStatus.PendingUpload)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "document.invalid_status",
                "Pending uploads must be confirmed before processing can be retried.");
        }

        document.Status = DocumentStatus.Uploaded;
        document.ProcessingError = null;
        document.UpdatedAt = DateTimeOffset.UtcNow;

        var aiJob = CreateProcessDocumentJob(document, userId);
        await aiJobRepository.AddAsync(aiJob, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await messagePublisher.PublishDocumentProcessingJobAsync(aiJob.Id, cancellationToken);

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

    private static void ValidateConfirmRequest(Document document, ConfirmUploadRequest request)
    {
        ValidateFileSize(request.FileSizeBytes);

        if (document.FileSizeBytes != request.FileSizeBytes)
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "document.file_size_mismatch",
                "Confirmed file size does not match the presigned upload request.");
        }

        if (!string.Equals(document.MimeType, request.ContentType.Trim(), StringComparison.OrdinalIgnoreCase))
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "document.content_type_mismatch",
                "Confirmed content type does not match the presigned upload request.");
        }
    }

    private static string CreateObjectKey(Guid workspaceId, Guid documentId, string fileExtension)
    {
        return $"workspaces/{workspaceId}/documents/{documentId}/original{fileExtension}";
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
            document.FileName,
            document.OriginalFileName,
            document.FileType,
            document.MimeType,
            document.FileSizeBytes,
            ToApiDocumentStatus(document.Status),
            document.Summary,
            DeserializeStringList(document.KeyPoints),
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
