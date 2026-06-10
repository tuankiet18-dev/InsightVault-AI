using System.Text.Json;
using InsightVault.API.Application.Abstractions.Messaging;
using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Abstractions.Services.Reports;
using InsightVault.API.Application.Abstractions.Services.Workspaces;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.DTOs.AiJobs;
using InsightVault.API.DTOs.Common;
using InsightVault.API.DTOs.Reports;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Application.Services.Reports;

public sealed class ReportService(
    InsightVaultDbContext db,
    ICurrentUserService currentUserService,
    IWorkspacePermissionService workspacePermissionService,
    IReportRepository reportRepository,
    IDocumentRepository documentRepository,
    IFolderRepository folderRepository,
    IMessagePublisher messagePublisher) : IReportService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<IReadOnlyList<ReportDto>> ListByWorkspaceAsync(
        Guid workspaceId,
        string? type = null,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(workspaceId, userId, cancellationToken);

        var reports = await reportRepository.ListByWorkspaceAsync(
            workspaceId,
            folderId: null,
            ParseReportType(type),
            cancellationToken);

        return reports.Select(ToDto).ToList();
    }

    public async Task<ReportDto> GetByIdAsync(
        Guid reportId,
        CancellationToken cancellationToken = default)
    {
        var report = await GetActiveReportAsync(reportId, cancellationToken);
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(report.WorkspaceId, userId, cancellationToken);

        return ToDto(report);
    }

    public async Task<AiJobDto> EnqueueReportGenerationAsync(
        Guid workspaceId,
        GenerateReportRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageDocumentsAsync(workspaceId, userId, cancellationToken);

        var reportType = ToDomainReportType(request.ReportType);
        await EnsureReportGroupCanAppendAsync(
            workspaceId,
            request.ReportGroupId,
            reportType,
            cancellationToken);
        var sources = await ResolveSourceDocumentsAsync(
            workspaceId,
            request.FolderId,
            request.DocumentIds,
            minimumDocumentCount: 1,
            cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var job = new AiJob
        {
            WorkspaceId = workspaceId,
            CreatedById = userId,
            JobType = AiJobType.GenerateReport,
            Status = AiJobStatus.Queued,
            InputPayload = JsonSerializer.Serialize(new ReportJobPayload(
                workspaceId,
                request.FolderId,
                request.ReportGroupId,
                userId,
                sources.Select(document => document.Id).ToList(),
                sources.Select(document => document.OriginalFileName).ToList(),
                NormalizeOptionalText(request.Title),
                NormalizeOptionalText(request.CustomPrompt),
                ToApiReportTypeString(reportType),
                StoreReport: true),
                JsonOptions),
            CreatedAt = now,
            UpdatedAt = now
        };

        await db.AiJobs.AddAsync(job, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await messagePublisher.PublishAiJobAsync(job.Id, cancellationToken);

        return ToAiJobDto(job);
    }

    public async Task<AiJobDto> EnqueueCompareAsync(
        Guid workspaceId,
        CompareDocumentsRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageDocumentsAsync(workspaceId, userId, cancellationToken);

        var sources = await ResolveSourceDocumentsAsync(
            workspaceId,
            request.FolderId,
            request.DocumentIds,
            minimumDocumentCount: 2,
            cancellationToken);
        await EnsureReportGroupCanAppendAsync(
            workspaceId,
            request.ReportGroupId,
            ReportType.ComparisonReport,
            cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var job = new AiJob
        {
            WorkspaceId = workspaceId,
            CreatedById = userId,
            JobType = AiJobType.CompareDocuments,
            Status = AiJobStatus.Queued,
            InputPayload = JsonSerializer.Serialize(new ReportJobPayload(
                workspaceId,
                request.FolderId,
                request.ReportGroupId,
                userId,
                sources.Select(document => document.Id).ToList(),
                sources.Select(document => document.OriginalFileName).ToList(),
                NormalizeOptionalText(request.Title),
                CustomPrompt: null,
                ReportType: ToApiReportTypeString(ReportType.ComparisonReport),
                StoreReport: true),
                JsonOptions),
            CreatedAt = now,
            UpdatedAt = now
        };

        await db.AiJobs.AddAsync(job, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);
        await messagePublisher.PublishAiJobAsync(job.Id, cancellationToken);

        return ToAiJobDto(job);
    }

    public async Task DeleteAsync(
        Guid reportId,
        CancellationToken cancellationToken = default)
    {
        var report = await GetActiveReportAsync(reportId, cancellationToken);
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageWorkspaceAsync(report.WorkspaceId, userId, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        report.DeletedAt = now;
        report.UpdatedAt = now;
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<Report> GetActiveReportAsync(
        Guid reportId,
        CancellationToken cancellationToken)
    {
        var report = await reportRepository.GetByIdAsync(reportId, cancellationToken);
        if (report is null || report.DeletedAt is not null)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "report.not_found",
                "Report not found.");
        }

        return report;
    }

    private async Task EnsureReportGroupCanAppendAsync(
        Guid workspaceId,
        Guid? reportGroupId,
        ReportType reportType,
        CancellationToken cancellationToken)
    {
        if (!reportGroupId.HasValue)
        {
            return;
        }

        var groupReports = await db.Reports
            .AsNoTracking()
            .Where(report => report.WorkspaceId == workspaceId
                && report.ReportGroupId == reportGroupId.Value)
            .Select(report => new { report.ReportType, report.DeletedAt })
            .ToListAsync(cancellationToken);

        if (groupReports.Count == 0)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "report.group_not_found",
                "Report group not found.");
        }

        if (groupReports.All(report => report.DeletedAt is not null))
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "report.group_deleted",
                "Cannot append a version to a deleted report group.");
        }

        if (groupReports.Any(report => report.ReportType != reportType))
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "report.group_type_mismatch",
                "Report group type does not match the requested report type.");
        }
    }

    private async Task<IReadOnlyList<Document>> ResolveSourceDocumentsAsync(
        Guid workspaceId,
        Guid? folderId,
        IReadOnlyList<Guid> requestedDocumentIds,
        int minimumDocumentCount,
        CancellationToken cancellationToken)
    {
        var explicitDocumentIds = requestedDocumentIds
            .Where(id => id != Guid.Empty)
            .Distinct()
            .ToList();
        var documentIds = explicitDocumentIds.ToList();

        if (folderId.HasValue)
        {
            var rootFolder = await folderRepository.GetByIdInWorkspaceAsync(
                folderId.Value,
                workspaceId,
                cancellationToken)
                ?? throw new ApiException(
                    StatusCodes.Status404NotFound,
                    "folder.not_found",
                    "Folder not found.");

            var folders = await folderRepository.ListActiveByWorkspaceAsync(workspaceId, cancellationToken);
            var folderIds = GetFolderTreeIds(folders, rootFolder.Id);
            var folderDocuments = await documentRepository.ListActiveByFolderIdsAsync(
                workspaceId,
                folderIds,
                cancellationToken);

            documentIds.AddRange(folderDocuments.Select(document => document.Id));
            documentIds = documentIds.Distinct().ToList();
        }

        if (documentIds.Count < minimumDocumentCount)
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "report.insufficient_documents",
                $"At least {minimumDocumentCount} completed documents are required.");
        }

        var documents = await documentRepository.ListCompletedByIdsAsync(
            workspaceId,
            documentIds,
            cancellationToken);
        var completedDocumentIds = documents.Select(document => document.Id).ToHashSet();

        if (explicitDocumentIds.Any(documentId => !completedDocumentIds.Contains(documentId)))
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "report.documents_unavailable",
                "All explicitly selected documents must be completed, active, and belong to the workspace.");
        }

        if (documents.Count < minimumDocumentCount)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "report.insufficient_completed_documents",
                $"At least {minimumDocumentCount} completed documents are required.");
        }

        return documents;
    }

    private static IReadOnlyCollection<Guid> GetFolderTreeIds(
        IReadOnlyList<Folder> folders,
        Guid rootFolderId)
    {
        var foldersByParentId = folders
            .Where(folder => folder.ParentFolderId.HasValue)
            .GroupBy(folder => folder.ParentFolderId!.Value)
            .ToDictionary(group => group.Key, group => group.ToList());

        var result = new List<Guid>();
        var stack = new Stack<Guid>();
        stack.Push(rootFolderId);

        while (stack.Count > 0)
        {
            var currentFolderId = stack.Pop();
            result.Add(currentFolderId);

            if (!foldersByParentId.TryGetValue(currentFolderId, out var childFolders))
            {
                continue;
            }

            foreach (var childFolder in childFolders)
            {
                stack.Push(childFolder.Id);
            }
        }

        return result;
    }

    private Guid GetRequiredUserId()
    {
        return currentUserService.UserId
            ?? throw new ApiException(
                StatusCodes.Status401Unauthorized,
                "auth.unauthorized",
                "A valid authenticated user is required.");
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static ReportType? ParseReportType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "summary_report" => ReportType.SummaryReport,
            "comparison_report" => ReportType.ComparisonReport,
            "gap_analysis_report" => ReportType.GapAnalysisReport,
            "gap_conflict_report" => ReportType.GapConflictReport,
            "folder_report" => ReportType.FolderReport,
            "section_report" => ReportType.SectionReport,
            "custom_report" => ReportType.CustomReport,
            _ => throw new ApiException(
                StatusCodes.Status400BadRequest,
                "report.invalid_type",
                "Report type is invalid.")
        };
    }

    private static ReportType ToDomainReportType(ApiReportType reportType)
    {
        return reportType switch
        {
            ApiReportType.SummaryReport => ReportType.SummaryReport,
            ApiReportType.ComparisonReport => ReportType.ComparisonReport,
            ApiReportType.GapAnalysisReport => ReportType.GapAnalysisReport,
            ApiReportType.GapConflictReport => ReportType.GapConflictReport,
            ApiReportType.FolderReport => ReportType.FolderReport,
            ApiReportType.SectionReport => ReportType.SectionReport,
            ApiReportType.CustomReport => ReportType.CustomReport,
            _ => throw new ArgumentOutOfRangeException(nameof(reportType), reportType, null)
        };
    }

    public static ReportDto ToDto(Report report)
    {
        return new ReportDto(
            report.Id,
            report.WorkspaceId,
            report.FolderId,
            report.ReportGroupId,
            report.VersionNumber,
            report.Title,
            ToApiReportType(report.ReportType),
            report.MarkdownContent,
            DeserializeStringList(report.SourceDocuments),
            DeserializeObject(report.StructuredResult),
            report.ModelName,
            report.CreatedAt,
            report.UpdatedAt);
    }

    public static string ToApiReportTypeString(ReportType reportType)
    {
        return reportType switch
        {
            ReportType.SummaryReport => "summary_report",
            ReportType.ComparisonReport => "comparison_report",
            ReportType.GapAnalysisReport => "gap_analysis_report",
            ReportType.GapConflictReport => "gap_conflict_report",
            ReportType.FolderReport => "folder_report",
            ReportType.SectionReport => "section_report",
            ReportType.CustomReport => "custom_report",
            _ => throw new ArgumentOutOfRangeException(nameof(reportType), reportType, null)
        };
    }

    public static ReportType ParseReportTypeRequired(string value)
    {
        return ParseReportType(value)
            ?? throw new ApiException(
                StatusCodes.Status400BadRequest,
                "report.invalid_type",
                "Report type is invalid.");
    }

    private static ApiReportType ToApiReportType(ReportType reportType)
    {
        return reportType switch
        {
            ReportType.SummaryReport => ApiReportType.SummaryReport,
            ReportType.ComparisonReport => ApiReportType.ComparisonReport,
            ReportType.GapAnalysisReport => ApiReportType.GapAnalysisReport,
            ReportType.GapConflictReport => ApiReportType.GapConflictReport,
            ReportType.FolderReport => ApiReportType.FolderReport,
            ReportType.SectionReport => ApiReportType.SectionReport,
            ReportType.CustomReport => ApiReportType.CustomReport,
            _ => throw new ArgumentOutOfRangeException(nameof(reportType), reportType, null)
        };
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

    private static object? DeserializeObject(string json)
    {
        try
        {
            return JsonSerializer.Deserialize<object>(json, JsonOptions);
        }
        catch (JsonException)
        {
            return null;
        }
    }
}
