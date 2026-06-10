using InsightVault.API.DTOs.Admin;

namespace InsightVault.API.Application.Abstractions.Services.Dashboard;

public interface IDashboardService
{
    Task<UserDashboardDto> GetCurrentUserDashboardAsync(
        CancellationToken cancellationToken = default);
}
