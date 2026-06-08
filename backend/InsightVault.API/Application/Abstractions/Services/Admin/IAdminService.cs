using InsightVault.API.DTOs.AiJobs;
using InsightVault.API.DTOs.Admin;
using InsightVault.API.DTOs.Auth;

namespace InsightVault.API.Application.Abstractions.Services.Admin;

public interface IAdminService
{
    Task<IReadOnlyList<UserDto>> ListUsersAsync(
        string? q = null,
        bool? isActive = null,
        CancellationToken cancellationToken = default);

    Task<UserDto> UpdateUserAsync(
        Guid userId,
        UpdateUserAdminRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AiJobDto>> ListAiJobsAsync(
        string? status = null,
        string? type = null,
        CancellationToken cancellationToken = default);
}
