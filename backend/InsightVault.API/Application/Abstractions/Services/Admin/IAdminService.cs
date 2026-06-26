using InsightVault.API.DTOs.AiJobs;
using InsightVault.API.DTOs.Admin;
using InsightVault.API.DTOs.Auth;

namespace InsightVault.API.Application.Abstractions.Services.Admin;

public interface IAdminService
{
    Task<IReadOnlyList<UserDto>> ListUsersAsync(
        string? q = null,
        bool? isActive = null,
        string? role = null,
        CancellationToken cancellationToken = default);

    Task<AdminUserDetailDto> GetUserDetailAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<UserDto> UpdateUserAsync(
        Guid userId,
        UpdateUserAdminRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AiJobDto>> ListAiJobsAsync(
        string? status = null,
        string? type = null,
        CancellationToken cancellationToken = default);

    Task<AdminAiJobDetailDto> GetAiJobDetailAsync(
        Guid jobId,
        CancellationToken cancellationToken = default);

    Task<AiJobDto> RetryAiJobAsync(
        Guid jobId,
        CancellationToken cancellationToken = default);

    Task<AiJobDto> CancelAiJobAsync(
        Guid jobId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AdminWorkspaceDto>> ListWorkspacesAsync(
        string? q = null,
        bool includeDeleted = false,
        CancellationToken cancellationToken = default);

    Task DeleteWorkspaceAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);


    Task<AdminBillingOverviewDto> GetBillingOverviewAsync(
        CancellationToken cancellationToken = default);

    Task<AdminSubscriptionPlanDto> UpdateSubscriptionPlanAsync(
        Guid planId,
        UpdateAdminSubscriptionPlanRequest request,
        CancellationToken cancellationToken = default);

    Task<AdminCreditPackageDto> UpdateCreditPackageAsync(
        Guid packageId,
        UpdateAdminCreditPackageRequest request,
        CancellationToken cancellationToken = default);

    Task<AdminSystemSettingsDto> GetSettingsAsync(
        CancellationToken cancellationToken = default);

    Task<AdminSystemSettingsDto> UpdateSettingsAsync(
        UpdateAdminSystemSettingsRequest request,
        CancellationToken cancellationToken = default);
}
