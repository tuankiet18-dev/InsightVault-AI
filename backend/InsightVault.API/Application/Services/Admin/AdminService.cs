using InsightVault.API.Application.Abstractions.Services.Admin;
using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Abstractions.Services.SystemSettings;
using InsightVault.API.Application.Abstractions.Messaging;
using InsightVault.API.Application.Services.AiJobs;
using InsightVault.API.Application.Services.SystemSettings;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.DTOs.Admin;
using InsightVault.API.DTOs.AiJobs;
using InsightVault.API.DTOs.Auth;
using InsightVault.API.DTOs.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace InsightVault.API.Application.Services.Admin;

public sealed class AdminService(
    InsightVaultDbContext db,
    ICurrentUserService currentUserService,
    IMessagePublisher messagePublisher,
    ISystemSettingReader systemSettingReader,
    IConfiguration configuration) : IAdminService
{
    private const int DefaultListLimit = 100;
    private const string DefaultAiModelKey = "ai.default_model";
    private const string DefaultWorkspaceCreditsKey = "billing.default_workspace_credits";
    private const string WebSearchEnabledKey = "ai.web_search_enabled";

    public async Task<IReadOnlyList<UserDto>> ListUsersAsync(
        string? q = null,
        bool? isActive = null,
        string? role = null,
        CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserIsAdminAsync(cancellationToken);

        var query = db.Users.AsNoTracking();
        var parsedRole = ParseSystemRole(role);

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

        if (parsedRole.HasValue)
        {
            query = query.Where(user => user.SystemRole == parsedRole.Value);
        }

        var users = await query
            .OrderBy(user => user.Email)
            .Take(DefaultListLimit)
            .ToListAsync(cancellationToken);

        return users.Select(ToUserDto).ToList();
    }

    public async Task<AdminUserDetailDto> GetUserDetailAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserIsAdminAsync(cancellationToken);

        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(
            candidate => candidate.Id == userId,
            cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status404NotFound,
                "admin.user_not_found",
                "User not found.");

        var ownedWorkspaceIds = await db.Workspaces
            .AsNoTracking()
            .Where(workspace => workspace.OwnerId == userId && workspace.DeletedAt == null)
            .Select(workspace => workspace.Id)
            .ToListAsync(cancellationToken);

        var ownedWorkspaceCount = ownedWorkspaceIds.Count;
        var memberWorkspaceCount = await db.WorkspaceMembers
            .AsNoTracking()
            .Where(member => member.UserId == userId && member.RemovedAt == null)
            .Select(member => member.WorkspaceId)
            .Distinct()
            .CountAsync(cancellationToken);

        var uploadedDocumentCount = await db.Documents
            .AsNoTracking()
            .CountAsync(document => document.UploadedById == userId && document.DeletedAt == null, cancellationToken);

        var storageBytes = await db.Documents
            .AsNoTracking()
            .Where(document => document.UploadedById == userId && document.DeletedAt == null)
            .SumAsync(document => (long?)document.FileSizeBytes, cancellationToken) ?? 0;

        var userSubscription = await db.UserSubscriptions
            .AsNoTracking()
            .FirstOrDefaultAsync(subscription => subscription.UserId == userId, cancellationToken);
        var aiCreditsRemaining = userSubscription != null
            ? userSubscription.RecurringCreditsRemaining + userSubscription.TopUpCreditsRemaining
            : 0;

        var paymentOrderCount = await db.PaymentOrders
            .AsNoTracking()
            .CountAsync(order => order.CreatedById == userId, cancellationToken);

        return new AdminUserDetailDto(
            ToUserDto(user),
            ownedWorkspaceCount,
            memberWorkspaceCount,
            uploadedDocumentCount,
            storageBytes,
            aiCreditsRemaining,
            paymentOrderCount,
            user.CreatedAt,
            user.UpdatedAt);
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

    public async Task DeleteUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var currentAdmin = await EnsureCurrentUserIsAdminAsync(cancellationToken);
        if (currentAdmin.Id == userId)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "admin.self_delete_forbidden",
                "Admins cannot delete their own account.");
        }

        var user = await db.Users.FirstOrDefaultAsync(
            candidate => candidate.Id == userId,
            cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status404NotFound,
                "admin.user_not_found",
                "User not found.");

        if (user.SystemRole == SystemRole.Admin
            && user.IsActive
            && !await HasAnotherActiveAdminAsync(user.Id, cancellationToken))
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "admin.last_admin_forbidden",
                "Cannot delete the last active admin.");
        }

        var ownedWorkspaceCount = await db.Workspaces
            .AsNoTracking()
            .CountAsync(workspace => workspace.OwnerId == userId, cancellationToken);
        var paymentOrderCount = await db.PaymentOrders
            .AsNoTracking()
            .CountAsync(order => order.CreatedById == userId, cancellationToken);
        var pendingInvitationCount = await db.WorkspaceInvitations
            .AsNoTracking()
            .CountAsync(invitation => invitation.InvitedUserId == userId, cancellationToken);

        if (ownedWorkspaceCount > 0 || paymentOrderCount > 0 || pendingInvitationCount > 0)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "admin.user_delete_blocked_by_references",
                "This user owns workspaces or has billing/invitation records. Transfer or archive those records before hard deleting the account.");
        }

        db.Users.Remove(user);
        await db.SaveChangesAsync(cancellationToken);
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

    public async Task<AdminAiJobDetailDto> GetAiJobDetailAsync(
        Guid jobId,
        CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserIsAdminAsync(cancellationToken);

        var job = await db.AiJobs
            .AsNoTracking()
            .Include(candidate => candidate.CreatedBy)
            .FirstOrDefaultAsync(candidate => candidate.Id == jobId, cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status404NotFound,
                "ai_job.not_found",
                "AI job not found.");

        return new AdminAiJobDetailDto(
            ToAiJobDto(job),
            job.CreatedById,
            job.CreatedBy?.Email,
            job.InputPayload,
            job.OutputPayload,
            job.ErrorMessage,
            job.StartedAt,
            job.CompletedAt);
    }

    public async Task<AiJobDto> RetryAiJobAsync(
        Guid jobId,
        CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserIsAdminAsync(cancellationToken);

        var job = await db.AiJobs
            .Include(candidate => candidate.Document)
            .FirstOrDefaultAsync(candidate => candidate.Id == jobId, cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status404NotFound,
                "ai_job.not_found",
                "AI job not found.");

        if (job.Status != AiJobStatus.Failed)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "ai_job.invalid_status",
                "Only failed AI jobs can be retried.");
        }

        if (job.JobType is not (AiJobType.ProcessDocument or AiJobType.GenerateReport or AiJobType.CompareDocuments))
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "ai_job.retry_not_supported",
                "Retry is currently supported only for process_document, generate_report, and compare_documents jobs.");
        }

        if (job.JobType == AiJobType.ProcessDocument
            && (job.Document is null || job.Document.DeletedAt is not null))
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

        if (job.Document is not null)
        {
            job.Document.Status = DocumentStatus.Uploaded;
            job.Document.ProcessingError = null;
            job.Document.UpdatedAt = now;
        }

        await db.SaveChangesAsync(cancellationToken);
        await PublishJobAsync(job, cancellationToken);

        return ToAiJobDto(job);
    }

    public async Task<AiJobDto> CancelAiJobAsync(
        Guid jobId,
        CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserIsAdminAsync(cancellationToken);

        var job = await db.AiJobs
            .Include(candidate => candidate.Document)
            .FirstOrDefaultAsync(candidate => candidate.Id == jobId, cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status404NotFound,
                "ai_job.not_found",
                "AI job not found.");

        if (job.Status is not (AiJobStatus.Queued or AiJobStatus.Processing))
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "ai_job.cancel_invalid_status",
                "Only queued or processing AI jobs can be cancelled.");
        }

        var now = DateTimeOffset.UtcNow;
        job.Status = AiJobStatus.Cancelled;
        job.CompletedAt = now;
        job.UpdatedAt = now;
        job.ErrorMessage ??= "Cancelled by system administrator.";

        if (job.Document is not null && job.Document.Status == DocumentStatus.Processing)
        {
            job.Document.Status = DocumentStatus.Failed;
            job.Document.ProcessingError = "Processing job was cancelled by system administrator.";
            job.Document.UpdatedAt = now;
        }

        await db.SaveChangesAsync(cancellationToken);

        return ToAiJobDto(job);
    }

    public async Task<IReadOnlyList<AdminWorkspaceDto>> ListWorkspacesAsync(
        string? q = null,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserIsAdminAsync(cancellationToken);

        var query = db.Workspaces
            .AsNoTracking()
            .Include(workspace => workspace.Owner)
                .ThenInclude(owner => owner.Subscription)
                    .ThenInclude(subscription => subscription!.Plan)
            .AsQueryable();

        if (!includeDeleted)
        {
            query = query.Where(workspace => workspace.DeletedAt == null);
        }

        if (!string.IsNullOrWhiteSpace(q))
        {
            var normalizedQuery = q.Trim().ToLowerInvariant();
            query = query.Where(workspace =>
                workspace.Name.ToLower().Contains(normalizedQuery)
                || workspace.Owner.Email.ToLower().Contains(normalizedQuery));
        }

        var workspaces = await query
            .OrderByDescending(workspace => workspace.UpdatedAt)
            .Take(DefaultListLimit)
            .Select(workspace => new AdminWorkspaceDto(
                workspace.Id,
                workspace.Name,
                workspace.Description,
                workspace.OwnerId,
                workspace.Owner.Email,
                workspace.IsArchived,
                workspace.Members.Count(member => member.RemovedAt == null),
                workspace.Documents.Count(document => document.DeletedAt == null),
                workspace.Documents
                    .Where(document => document.DeletedAt == null)
                    .Sum(document => (long?)document.FileSizeBytes) ?? 0,
                workspace.Reports.Count(report => report.DeletedAt == null),
                workspace.AiJobs.Count,
                workspace.Owner.Subscription != null ? workspace.Owner.Subscription.Plan.Name : null,
                workspace.Owner.Subscription != null
                    ? workspace.Owner.Subscription.RecurringCreditsRemaining + workspace.Owner.Subscription.TopUpCreditsRemaining
                    : 0,
                workspace.CreatedAt,
                workspace.UpdatedAt,
                workspace.DeletedAt))
            .ToListAsync(cancellationToken);

        return workspaces;
    }

    public async Task<AdminBillingOverviewDto> GetBillingOverviewAsync(
        CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserIsAdminAsync(cancellationToken);

        var orders = await db.PaymentOrders
            .AsNoTracking()
            .Include(order => order.CreatedBy)
            .OrderByDescending(order => order.CreatedAt)
            .Take(DefaultListLimit)
            .ToListAsync(cancellationToken);

        var totalRevenue = await db.PaymentOrders
            .AsNoTracking()
            .Where(order => order.Status == PaymentOrderStatus.Paid)
            .SumAsync(order => (long?)order.AmountVnd, cancellationToken) ?? 0;
        var paidOrderCount = await db.PaymentOrders
            .AsNoTracking()
            .CountAsync(order => order.Status == PaymentOrderStatus.Paid, cancellationToken);
        var pendingOrderCount = await db.PaymentOrders
            .AsNoTracking()
            .CountAsync(order => order.Status == PaymentOrderStatus.Pending, cancellationToken);
        var activeSubscriptionCount = await db.UserSubscriptions
            .AsNoTracking()
            .CountAsync(subscription => subscription.Status == SubscriptionStatus.Active, cancellationToken);

        var planEntities = await db.SubscriptionPlans
            .AsNoTracking()
            .OrderBy(plan => plan.DisplayOrder)
            .ToListAsync(cancellationToken);
        var packageEntities = await db.CreditPackages
            .AsNoTracking()
            .OrderBy(package => package.DisplayOrder)
            .ToListAsync(cancellationToken);

        return new AdminBillingOverviewDto(
            totalRevenue,
            totalRevenue,
            await db.PaymentOrders.AsNoTracking().CountAsync(cancellationToken),
            paidOrderCount,
            pendingOrderCount,
            activeSubscriptionCount,
            orders.Select(ToPaymentOrderDto).ToList(),
            planEntities.Select(ToPlanDto).ToList(),
            packageEntities.Select(ToCreditPackageDto).ToList());
    }

    public async Task<AdminSubscriptionPlanDto> UpdateSubscriptionPlanAsync(
        Guid planId,
        UpdateAdminSubscriptionPlanRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserIsAdminAsync(cancellationToken);

        var plan = await db.SubscriptionPlans.FirstOrDefaultAsync(
            candidate => candidate.Id == planId,
            cancellationToken)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "admin.plan_not_found", "Subscription plan not found.");

        if (request.Name is not null) plan.Name = request.Name.Trim();
        if (request.Description is not null) plan.Description = request.Description.Trim();
        if (request.PriceVnd.HasValue) plan.PriceVnd = Math.Max(0, request.PriceVnd.Value);
        if (request.IncludedCredits.HasValue) plan.IncludedCredits = Math.Max(0, request.IncludedCredits.Value);
        if (request.MaxMembers.HasValue) plan.MaxMembers = Math.Max(1, request.MaxMembers.Value);
        if (request.StorageLimitBytes.HasValue) plan.StorageLimitBytes = Math.Max(0, request.StorageLimitBytes.Value);
        if (request.IsActive.HasValue) plan.IsActive = request.IsActive.Value;
        if (request.DisplayOrder.HasValue) plan.DisplayOrder = request.DisplayOrder.Value;
        plan.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return ToPlanDto(plan);
    }

    public async Task<AdminCreditPackageDto> UpdateCreditPackageAsync(
        Guid packageId,
        UpdateAdminCreditPackageRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserIsAdminAsync(cancellationToken);

        var package = await db.CreditPackages.FirstOrDefaultAsync(
            candidate => candidate.Id == packageId,
            cancellationToken)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "admin.credit_package_not_found", "Credit package not found.");

        if (request.Name is not null) package.Name = request.Name.Trim();
        if (request.PriceVnd.HasValue) package.PriceVnd = Math.Max(0, request.PriceVnd.Value);
        if (request.Credits.HasValue) package.Credits = Math.Max(1, request.Credits.Value);
        if (request.IsActive.HasValue) package.IsActive = request.IsActive.Value;
        if (request.DisplayOrder.HasValue) package.DisplayOrder = request.DisplayOrder.Value;
        package.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return ToCreditPackageDto(package);
    }

    public async Task<AdminSystemSettingsDto> GetSettingsAsync(
        CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserIsAdminAsync(cancellationToken);

        return await BuildSettingsDtoAsync(cancellationToken);
    }

    public async Task<AdminSystemSettingsDto> UpdateSettingsAsync(
        UpdateAdminSystemSettingsRequest request,
        CancellationToken cancellationToken = default)
    {
        await EnsureCurrentUserIsAdminAsync(cancellationToken);
        var now = DateTimeOffset.UtcNow;

        if (request.DefaultAiModel is not null)
        {
            var normalizedModel = SystemSettingValidation.NormalizeAiModelName(request.DefaultAiModel);
            await UpsertSettingAsync(
                DefaultAiModelKey,
                normalizedModel,
                "string",
                "Default AI model used by configurable AI workflows.",
                now,
                cancellationToken);
        }

        if (request.DefaultWorkspaceCredits.HasValue)
        {
            var normalizedCredits = Math.Max(0, request.DefaultWorkspaceCredits.Value);
            await UpsertSettingAsync(
                DefaultWorkspaceCreditsKey,
                normalizedCredits.ToString(),
                "int",
                "Default credits granted to a newly provisioned workspace when no plan override applies.",
                now,
                cancellationToken);

            var freePlan = await db.SubscriptionPlans.FirstOrDefaultAsync(
                plan => plan.Code == "free",
                cancellationToken);
            if (freePlan is not null)
            {
                freePlan.IncludedCredits = normalizedCredits;
                freePlan.UpdatedAt = now;
            }
        }

        if (request.WebSearchEnabled.HasValue)
        {
            await UpsertSettingAsync(
                WebSearchEnabledKey,
                request.WebSearchEnabled.Value ? "true" : "false",
                "bool",
                "Feature flag for AI web search augmentation.",
                now,
                cancellationToken);
        }

        await db.SaveChangesAsync(cancellationToken);
        if (request.DefaultAiModel is not null)
        {
            systemSettingReader.Invalidate(DefaultAiModelKey);
        }

        if (request.WebSearchEnabled.HasValue)
        {
            systemSettingReader.Invalidate(WebSearchEnabledKey);
        }

        if (request.DefaultWorkspaceCredits.HasValue)
        {
            systemSettingReader.Invalidate(DefaultWorkspaceCreditsKey);
        }

        return await BuildSettingsDtoAsync(cancellationToken);
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

    private static SystemRole? ParseSystemRole(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        return value.Trim().ToLowerInvariant() switch
        {
            "admin" => SystemRole.Admin,
            "user" => SystemRole.User,
            _ => throw new ApiException(
                StatusCodes.Status400BadRequest,
                "admin.invalid_role",
                "System role is invalid.")
        };
    }

    private async Task PublishJobAsync(AiJob job, CancellationToken cancellationToken)
    {
        if (job.JobType == AiJobType.ProcessDocument)
        {
            await messagePublisher.PublishDocumentProcessingJobAsync(job.Id, cancellationToken);
            return;
        }

        await messagePublisher.PublishAiJobAsync(job.Id, cancellationToken);
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

    private static AdminPaymentOrderDto ToPaymentOrderDto(PaymentOrder order)
    {
        return new AdminPaymentOrderDto(
            order.Id,
            Guid.Empty,
            "",
            order.CreatedById,
            order.CreatedBy.Email,
            order.PurchaseType.ToString(),
            order.Status.ToString(),
            order.Provider,
            order.AmountVnd,
            order.PaidAt,
            order.CreatedAt);
    }

    private static AdminSubscriptionPlanDto ToPlanDto(SubscriptionPlan plan)
    {
        return new AdminSubscriptionPlanDto(
            plan.Id,
            plan.Code,
            plan.Name,
            plan.Description,
            plan.PriceVnd,
            plan.BillingPeriodMonths,
            plan.IncludedCredits,
            plan.MaxMembers,
            plan.StorageLimitBytes,
            plan.IsActive,
            plan.DisplayOrder);
    }

    private static AdminCreditPackageDto ToCreditPackageDto(CreditPackage package)
    {
        return new AdminCreditPackageDto(
            package.Id,
            package.Code,
            package.Name,
            package.PriceVnd,
            package.Credits,
            package.IsActive,
            package.DisplayOrder);
    }

    private async Task UpsertSettingAsync(
        string key,
        string value,
        string valueType,
        string description,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var setting = await db.SystemSettings.FirstOrDefaultAsync(
            candidate => candidate.Key == key,
            cancellationToken);

        if (setting is null)
        {
            db.SystemSettings.Add(new SystemSetting
            {
                Key = key,
                Value = value,
                ValueType = valueType,
                Description = description,
                CreatedAt = now,
                UpdatedAt = now
            });
            return;
        }

        setting.Value = value;
        setting.ValueType = valueType;
        setting.Description = description;
        setting.UpdatedAt = now;
    }

    private async Task<AdminSystemSettingsDto> BuildSettingsDtoAsync(CancellationToken cancellationToken)
    {
        var settings = await db.SystemSettings
            .AsNoTracking()
            .ToDictionaryAsync(setting => setting.Key, setting => setting.Value, cancellationToken);

        var defaultModel = GetStringSetting(
            settings,
            DefaultAiModelKey,
            configuration["AI:DefaultModel"] ?? SystemSettingKeys.DefaultAiModelFallback);
        var defaultCredits = GetIntSetting(
            settings,
            DefaultWorkspaceCreditsKey,
            configuration.GetValue("Billing:DefaultWorkspaceCredits", 100));
        var webSearchEnabled = GetBoolSetting(
            settings,
            WebSearchEnabledKey,
            configuration.GetValue("AI:WebSearchEnabled", false));

        return new AdminSystemSettingsDto(
            configuration["AIService:BaseUrl"] ?? "http://ai-service:8000",
            defaultModel,
            defaultCredits,
            webSearchEnabled,
            configuration.GetValue("Smtp:Enabled", false),
            configuration.GetValue("PayOS:Enabled", false),
            true);
    }

    private static string GetStringSetting(
        IReadOnlyDictionary<string, string> settings,
        string key,
        string fallback)
    {
        return settings.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
            ? value
            : fallback;
    }

    private static int GetIntSetting(
        IReadOnlyDictionary<string, string> settings,
        string key,
        int fallback)
    {
        return settings.TryGetValue(key, out var value) && int.TryParse(value, out var parsed)
            ? parsed
            : fallback;
    }

    private static bool GetBoolSetting(
        IReadOnlyDictionary<string, string> settings,
        string key,
        bool fallback)
    {
        return settings.TryGetValue(key, out var value) && bool.TryParse(value, out var parsed)
            ? parsed
            : fallback;
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
