using InsightVault.API.Application.Abstractions.Services.Admin;
using InsightVault.API.DTOs.Admin;
using InsightVault.API.DTOs.AiJobs;
using InsightVault.API.DTOs.Auth;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightVault.API.Controllers;

[ApiController]
[Authorize]
public sealed class AdminController(IAdminService adminService) : ControllerBase
{
    [HttpGet("api/admin/users")]
    public async Task<ActionResult<IReadOnlyList<UserDto>>> ListUsers(
        [FromQuery] string? q,
        [FromQuery] bool? isActive,
        CancellationToken cancellationToken)
    {
        var users = await adminService.ListUsersAsync(q, isActive, cancellationToken);

        return Ok(users);
    }

    [HttpPatch("api/admin/users/{userId:guid}")]
    public async Task<ActionResult<UserDto>> UpdateUser(
        Guid userId,
        UpdateUserAdminRequest request,
        CancellationToken cancellationToken)
    {
        var user = await adminService.UpdateUserAsync(userId, request, cancellationToken);

        return Ok(user);
    }

    [HttpGet("api/admin/ai-jobs")]
    public async Task<ActionResult<IReadOnlyList<AiJobDto>>> ListAiJobs(
        [FromQuery] string? status,
        [FromQuery] string? type,
        CancellationToken cancellationToken)
    {
        var jobs = await adminService.ListAiJobsAsync(status, type, cancellationToken);

        return Ok(jobs);
    }
}
