using InsightVault.API.Application.Abstractions.Messaging;
using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Application.Abstractions.Services.AiJobs;
using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Abstractions.Services.Workspaces;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.DTOs.AiJobs;
using InsightVault.API.DTOs.Common;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Application.Services.AiJobs;

public sealed class AiJobService(
    InsightVaultDbContext db,
    ICurrentUserService currentUserService,
    IWorkspacePermissionService workspacePermissionService,
    IAiJobRepository aiJobRepository,
    IMessagePublisher messagePublisher) : IAiJobService
{
    private const int DefaultListLimit = 50;

    public async Task<IReadOnlyList<AiJobDto>> ListByWorkspaceAsync(
        Guid workspaceId,
        string? status = null,
        string? type = null,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(workspaceId, userId, cancellationToken);

        var jobs = await aiJobRepository.ListRecentByWorkspaceAsync(
            workspaceId,
            ParseStatus(status),
            ParseType(type),
            DefaultListLimit,
            cancellationToken);

        return jobs.Select(ToDto).ToList();
    }

    public async Task<AiJobDto> GetByIdAsync(
        Guid jobId,
        CancellationToken cancellationToken = default)
    {
        var job = await GetJobOrThrowAsync(jobId, cancellationToken);
        var userId = GetRequiredUserId();
        await EnsureCanViewJobAsync(job, userId, cancellationToken);

        return ToDto(job);
    }

    public async Task<AiJobDto> RetryAsync(
        Guid jobId,
        CancellationToken cancellationToken = default)
    {
        var job = await GetJobOrThrowAsync(jobId, cancellationToken);
        var userId = GetRequiredUserId();
        await EnsureCanRetryJobAsync(job, userId, cancellationToken);

        if (job.Status != AiJobStatus.Failed)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "ai_job.invalid_status",
                "Only failed AI jobs can be retried.");
        }

        if (job.JobType != AiJobType.ProcessDocument)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "ai_job.retry_not_supported",
                "Retry is currently supported only for process_document jobs.");
        }

        if (job.Document is null || job.Document.DeletedAt is not null)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "ai_job.document_unavailable",
                "The source document is missing or has been deleted.");
        }

        var now = DateTimeOffset.UtcNow;
        job.Status = AiJobStatus.Queued;
        job.RetryCount += 1;
        job.ErrorMessage = null;
        job.OutputPayload = "{}";
        job.StartedAt = null;
        job.CompletedAt = null;
        job.UpdatedAt = now;

        job.Document.Status = DocumentStatus.Uploaded;
        job.Document.ProcessingError = null;
        job.Document.UpdatedAt = now;

        await db.SaveChangesAsync(cancellationToken);
        await messagePublisher.PublishDocumentProcessingJobAsync(job.Id, cancellationToken);

        return ToDto(job);
    }

    private async Task<AiJob> GetJobOrThrowAsync(
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var job = await db.AiJobs
            .Include(candidate => candidate.Document)
            .FirstOrDefaultAsync(candidate => candidate.Id == jobId, cancellationToken);
        if (job is null)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "ai_job.not_found",
                "AI job not found.");
        }

        return job;
    }

    private Guid GetRequiredUserId()
    {
        return currentUserService.UserId
            ?? throw new ApiException(
                StatusCodes.Status401Unauthorized,
                "auth.unauthorized",
                "A valid authenticated user is required.");
    }

    private async Task EnsureCanViewJobAsync(
        AiJob job,
        Guid userId,
        CancellationToken cancellationToken)
    {
        if (!job.WorkspaceId.HasValue)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "ai_job.not_found",
                "AI job not found.");
        }

        await workspacePermissionService.EnsureCanViewWorkspaceAsync(
            job.WorkspaceId.Value,
            userId,
            cancellationToken);
    }

    private async Task EnsureCanRetryJobAsync(
        AiJob job,
        Guid userId,
        CancellationToken cancellationToken)
    {
        if (!job.WorkspaceId.HasValue)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "ai_job.not_found",
                "AI job not found.");
        }

        await workspacePermissionService.EnsureCanManageDocumentsAsync(
            job.WorkspaceId.Value,
            userId,
            cancellationToken);
    }

    private static AiJobStatus? ParseStatus(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "queued" => AiJobStatus.Queued,
            "processing" => AiJobStatus.Processing,
            "completed" => AiJobStatus.Completed,
            "failed" => AiJobStatus.Failed,
            "cancelled" => AiJobStatus.Cancelled,
            _ => throw new ApiException(
                StatusCodes.Status400BadRequest,
                "ai_job.invalid_status",
                "AI job status is invalid.")
        };
    }

    private static AiJobType? ParseType(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "process_document" => AiJobType.ProcessDocument,
            "generate_summary" => AiJobType.GenerateSummary,
            "rag_chat" => AiJobType.RagChat,
            "generate_report" => AiJobType.GenerateReport,
            "compare_documents" => AiJobType.CompareDocuments,
            _ => throw new ApiException(
                StatusCodes.Status400BadRequest,
                "ai_job.invalid_type",
                "AI job type is invalid.")
        };
    }

    private static AiJobDto ToDto(AiJob job)
    {
        return new AiJobDto(
            job.Id,
            job.WorkspaceId,
            job.DocumentId,
            ToApiJobType(job.JobType),
            ToApiJobStatus(job.Status),
            job.RetryCount,
            job.ErrorMessage,
            job.CreatedAt,
            job.UpdatedAt);
    }

    private static ApiAiJobType ToApiJobType(AiJobType jobType)
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

    private static ApiAiJobStatus ToApiJobStatus(AiJobStatus status)
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
