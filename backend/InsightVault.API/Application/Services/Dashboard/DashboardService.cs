using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Abstractions.Services.Dashboard;
using InsightVault.API.Application.Services.AiJobs;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.DTOs.Admin;
using InsightVault.API.DTOs.AiJobs;
using InsightVault.API.DTOs.Common;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Application.Services.Dashboard;

public sealed class DashboardService(
    InsightVaultDbContext db,
    ICurrentUserService currentUserService) : IDashboardService
{
    private const int RecentJobsLimit = 10;

    public async Task<UserDashboardDto> GetCurrentUserDashboardAsync(
        CancellationToken cancellationToken = default)
    {
        var user = await GetCurrentUserAsync(cancellationToken);

        if (user.SystemRole == SystemRole.Admin)
        {
            return await GetAdminDashboardAsync(cancellationToken);
        }

        return await GetWorkspaceUserDashboardAsync(user.Id, cancellationToken);
    }

    private async Task<UserDashboardDto> GetWorkspaceUserDashboardAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var workspaceIds = await db.WorkspaceMembers
            .AsNoTracking()
            .Where(member => member.UserId == userId
                && member.Status == MemberStatus.Active
                && member.Workspace.DeletedAt == null)
            .Select(member => member.WorkspaceId)
            .Distinct()
            .ToListAsync(cancellationToken);

        if (workspaceIds.Count == 0)
        {
            return new UserDashboardDto(0, 0, 0, 0, 0, 0, 0, []);
        }

        var folderCount = await db.Folders.CountAsync(
            folder => workspaceIds.Contains(folder.WorkspaceId)
                && folder.DeletedAt == null,
            cancellationToken);
        var documentCount = await db.Documents.CountAsync(
            document => workspaceIds.Contains(document.WorkspaceId)
                && document.DeletedAt == null,
            cancellationToken);
        var completedDocumentCount = await CountDocumentsByStatusAsync(
            workspaceIds,
            DocumentStatus.Completed,
            cancellationToken);
        var processingDocumentCount = await CountDocumentsByStatusAsync(
            workspaceIds,
            DocumentStatus.Processing,
            cancellationToken);
        var failedDocumentCount = await CountDocumentsByStatusAsync(
            workspaceIds,
            DocumentStatus.Failed,
            cancellationToken);
        var reportCount = await db.Reports.CountAsync(
            report => workspaceIds.Contains(report.WorkspaceId)
                && report.DeletedAt == null,
            cancellationToken);
        var recentJobs = await db.AiJobs
            .AsNoTracking()
            .Where(job => job.WorkspaceId.HasValue
                && workspaceIds.Contains(job.WorkspaceId.Value))
            .OrderByDescending(job => job.CreatedAt)
            .Take(RecentJobsLimit)
            .ToListAsync(cancellationToken);

        return new UserDashboardDto(
            workspaceIds.Count,
            folderCount,
            documentCount,
            completedDocumentCount,
            processingDocumentCount,
            failedDocumentCount,
            reportCount,
            recentJobs.Select(ToAiJobDto).ToList());
    }

    private async Task<UserDashboardDto> GetAdminDashboardAsync(CancellationToken cancellationToken)
    {
        var workspaceCount = await db.Workspaces.CountAsync(
            workspace => workspace.DeletedAt == null,
            cancellationToken);
        var folderCount = await db.Folders.CountAsync(
            folder => folder.DeletedAt == null,
            cancellationToken);
        var documentCount = await db.Documents.CountAsync(
            document => document.DeletedAt == null,
            cancellationToken);
        var completedDocumentCount = await CountDocumentsByStatusAsync(
            DocumentStatus.Completed,
            cancellationToken);
        var processingDocumentCount = await CountDocumentsByStatusAsync(
            DocumentStatus.Processing,
            cancellationToken);
        var failedDocumentCount = await CountDocumentsByStatusAsync(
            DocumentStatus.Failed,
            cancellationToken);
        var reportCount = await db.Reports.CountAsync(
            report => report.DeletedAt == null,
            cancellationToken);
        var recentJobs = await db.AiJobs
            .AsNoTracking()
            .OrderByDescending(job => job.CreatedAt)
            .Take(RecentJobsLimit)
            .ToListAsync(cancellationToken);

        return new UserDashboardDto(
            workspaceCount,
            folderCount,
            documentCount,
            completedDocumentCount,
            processingDocumentCount,
            failedDocumentCount,
            reportCount,
            recentJobs.Select(ToAiJobDto).ToList());
    }

    private async Task<User> GetCurrentUserAsync(CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new ApiException(
                StatusCodes.Status401Unauthorized,
                "auth.unauthorized",
                "A valid authenticated user is required.");

        var user = await db.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(candidate => candidate.Id == userId, cancellationToken);

        if (user is null || !user.IsActive)
        {
            throw new ApiException(
                StatusCodes.Status401Unauthorized,
                "auth.unauthorized",
                "A valid authenticated user is required.");
        }

        return user;
    }

    private Task<int> CountDocumentsByStatusAsync(
        IReadOnlyList<Guid> workspaceIds,
        DocumentStatus status,
        CancellationToken cancellationToken)
    {
        return db.Documents.CountAsync(
            document => workspaceIds.Contains(document.WorkspaceId)
                && document.DeletedAt == null
                && document.Status == status,
            cancellationToken);
    }

    private Task<int> CountDocumentsByStatusAsync(
        DocumentStatus status,
        CancellationToken cancellationToken)
    {
        return db.Documents.CountAsync(
            document => document.DeletedAt == null
                && document.Status == status,
            cancellationToken);
    }

    private static AiJobDto ToAiJobDto(AiJob job)
    {
        return new AiJobDto(
            job.Id,
            job.WorkspaceId,
            job.DocumentId,
            AiJobOutputPayload.GetReportId(job),
            ToApiAiJobType(job.JobType),
            ToApiAiJobStatus(job.Status),
            job.RetryCount,
            job.ErrorMessage,
            job.CreatedAt,
            job.UpdatedAt);
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
