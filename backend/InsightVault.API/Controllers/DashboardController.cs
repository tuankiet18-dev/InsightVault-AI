using InsightVault.API.Application.Abstractions.Services.Dashboard;
using InsightVault.API.DTOs.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightVault.API.Controllers;

[ApiController]
[Authorize]
public sealed class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    [HttpGet("api/dashboard/me")]
    public async Task<ActionResult<UserDashboardDto>> GetMyDashboard(
        CancellationToken cancellationToken)
    {
        var dashboard = await dashboardService.GetCurrentUserDashboardAsync(cancellationToken);

        return Ok(dashboard);
    }
}
