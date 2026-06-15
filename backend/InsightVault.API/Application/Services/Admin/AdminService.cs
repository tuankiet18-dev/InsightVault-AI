using InsightVault.API.Application.Abstractions.Services.Admin;
using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Services.AiJobs;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.DTOs.Admin;
using InsightVault.API.DTOs.AiJobs;
using InsightVault.API.DTOs.Auth;
using InsightVault.API.DTOs.Common;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Application.Services.Admin;

public sealed class AdminService(
    InsightVaultDbContext db,
    ICurrentUserService currentUserService) : IAdminService
{
    private const int DefaultListLimit = 100;

    public async Task<IReadOnlyList<UserDto>> ListUsersAsync(
        string? q = null,
        bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserIsAdminAsync(cancellationToken);

        var query = db.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(q))
        {
            var normalizedQuery = q.Trim().ToLowerInvariant();
            query = query.Where(user =>
                user.Email.ToLower().Contains(normalizedQuery)
                || user.FullName.ToLower().Contains(normalizedQuery));
        }

        if (isActive.HasValue)
        {
            query = query.Where(user => user.IsActive == isActive.Value);
        }

        var users = await query
            .OrderBy(user => user.Email)
            .Take(DefaultListLimit)
            .ToListAsync(cancellationToken);

        return users.Select(ToUserDto).ToList();
    }

    public async Task<UserDto> UpdateUserAsync(
        Guid userId,
        UpdateUserAdminRequest request,
        CancellationToken cancellationToken = default)
    {
        var currentAdmin = await EnsureCurrentUserIsAdminAsync(cancellationToken);
        var user = await db.Users.FirstOrDefaultAsync(
            candidate => candidate.Id == userId,
            cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status404NotFound,
                "admin.user_not_found",
                "User not found.");

        var nextSystemRole = request.SystemRole.HasValue
            ? ToDomainSystemRole(request.SystemRole.Value)
            : user.SystemRole;
        var nextIsActive = request.IsActive ?? user.IsActive;

        if (user.Id == currentAdmin.Id
            && (nextSystemRole != SystemRole.Admin || !nextIsActive))
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "admin.self_lockout_forbidden",
                "Admins cannot deactivate or demote their own account.");
        }

        if (user.SystemRole == SystemRole.Admin
            && user.IsActive
            && (nextSystemRole != SystemRole.Admin || !nextIsActive)
            && !await HasAnotherActiveAdminAsync(user.Id, cancellationToken))
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "admin.last_admin_forbidden",
                "Cannot deactivate or demote the last active admin.");
        }

        user.SystemRole = nextSystemRole;
        user.IsActive = nextIsActive;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return ToUserDto(user);
    }

    public async Task<IReadOnlyList<AiJobDto>> ListAiJobsAsync(
        string? status = null,
        string? type = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserIsAdminAsync(cancellationToken);

        var query = db.AiJobs.AsNoTracking();
        var parsedStatus = ParseStatus(status);
        var parsedType = ParseType(type);

        if (parsedStatus.HasValue)
        {
            query = query.Where(job => job.Status == parsedStatus.Value);
        }

        if (parsedType.HasValue)
        {
            query = query.Where(job => job.JobType == parsedType.Value);
        }

        var jobs = await query
            .OrderByDescending(job => job.CreatedAt)
            .Take(DefaultListLimit)
            .ToListAsync(cancellationToken);

        return jobs.Select(ToAiJobDto).ToList();
    }

    private async Task<User> EnsureCurrentUserIsAdminAsync(CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new ApiException(
                StatusCodes.Status401Unauthorized,
                "auth.unauthorized",
                "A valid authenticated user is required.");

        var user = await db.Users.FirstOrDefaultAsync(
            candidate => candidate.Id == userId,
            cancellationToken);

        if (user is not { IsActive: true, SystemRole: SystemRole.Admin })
        {
            throw new ApiException(
                StatusCodes.Status403Forbidden,
                "admin.forbidden",
                "Admin access is required.");
        }

        return user;
    }

    private async Task<bool> HasAnotherActiveAdminAsync(
        Guid excludedUserId,
        CancellationToken cancellationToken)
    {
        return await db.Users.AnyAsync(
            user => user.Id != excludedUserId
                && user.IsActive
                && user.SystemRole == SystemRole.Admin,
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

    private static UserDto ToUserDto(User user)
    {
        return new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.AvatarUrl,
            ToApiSystemRole(user.SystemRole),
            user.IsActive,
            user.LastLoginAt);
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

    private static SystemRole ToDomainSystemRole(ApiSystemRole role)
    {
        return role switch
        {
            ApiSystemRole.Admin => SystemRole.Admin,
            ApiSystemRole.User => SystemRole.User,
            _ => throw new ArgumentOutOfRangeException(nameof(role), role, null)
        };
    }

    private static ApiSystemRole ToApiSystemRole(SystemRole role)
    {
        return role switch
        {
            SystemRole.Admin => ApiSystemRole.Admin,
            SystemRole.User => ApiSystemRole.User,
            _ => throw new ArgumentOutOfRangeException(nameof(role), role, null)
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
