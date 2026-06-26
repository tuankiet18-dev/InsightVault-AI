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
        [FromQuery] string? role,
        CancellationToken cancellationToken)
    {
        var users = await adminService.ListUsersAsync(q, isActive, role, cancellationToken);

        return Ok(users);
    }

    [HttpGet("api/admin/users/{userId:guid}")]
    public async Task<ActionResult<AdminUserDetailDto>> GetUserDetail(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await adminService.GetUserDetailAsync(userId, cancellationToken);

        return Ok(user);
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

    [HttpDelete("api/admin/users/{userId:guid}")]
    public async Task<IActionResult> DeleteUser(
        Guid userId,
        CancellationToken cancellationToken)
    {
        await adminService.DeleteUserAsync(userId, cancellationToken);

        return NoContent();
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

    [HttpGet("api/admin/ai-jobs/{jobId:guid}")]
    public async Task<ActionResult<AdminAiJobDetailDto>> GetAiJobDetail(
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var job = await adminService.GetAiJobDetailAsync(jobId, cancellationToken);

        return Ok(job);
    }

    [HttpPost("api/admin/ai-jobs/{jobId:guid}/retry")]
    public async Task<ActionResult<AiJobDto>> RetryAiJob(
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var job = await adminService.RetryAiJobAsync(jobId, cancellationToken);

        return Ok(job);
    }

    [HttpPost("api/admin/ai-jobs/{jobId:guid}/cancel")]
    public async Task<ActionResult<AiJobDto>> CancelAiJob(
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var job = await adminService.CancelAiJobAsync(jobId, cancellationToken);

        return Ok(job);
    }

    [HttpGet("api/admin/workspaces")]
    public async Task<ActionResult<IReadOnlyList<AdminWorkspaceDto>>> ListWorkspaces(
        [FromQuery] string? q,
        [FromQuery] bool includeDeleted,
        CancellationToken cancellationToken)
    {
        var workspaces = await adminService.ListWorkspacesAsync(q, includeDeleted, cancellationToken);

        return Ok(workspaces);
    }

    [HttpDelete("api/admin/workspaces/{workspaceId:guid}")]
    public async Task<IActionResult> DeleteWorkspace(
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        await adminService.DeleteWorkspaceAsync(workspaceId, cancellationToken);

        return NoContent();
    }

    [HttpGet("api/admin/billing")]
    public async Task<ActionResult<AdminBillingOverviewDto>> GetBilling(
        CancellationToken cancellationToken)
    {
        var billing = await adminService.GetBillingOverviewAsync(cancellationToken);

        return Ok(billing);
    }

    [HttpPatch("api/admin/billing/plans/{planId:guid}")]
    public async Task<ActionResult<AdminSubscriptionPlanDto>> UpdateSubscriptionPlan(
        Guid planId,
        UpdateAdminSubscriptionPlanRequest request,
        CancellationToken cancellationToken)
    {
        var plan = await adminService.UpdateSubscriptionPlanAsync(planId, request, cancellationToken);

        return Ok(plan);
    }

    [HttpPatch("api/admin/billing/credit-packages/{packageId:guid}")]
    public async Task<ActionResult<AdminCreditPackageDto>> UpdateCreditPackage(
        Guid packageId,
        UpdateAdminCreditPackageRequest request,
        CancellationToken cancellationToken)
    {
        var package = await adminService.UpdateCreditPackageAsync(packageId, request, cancellationToken);

        return Ok(package);
    }

    [HttpGet("api/admin/settings")]
    public async Task<ActionResult<AdminSystemSettingsDto>> GetSettings(
        CancellationToken cancellationToken)
    {
        var settings = await adminService.GetSettingsAsync(cancellationToken);

        return Ok(settings);
    }

    [HttpPatch("api/admin/settings")]
    public async Task<ActionResult<AdminSystemSettingsDto>> UpdateSettings(
        UpdateAdminSystemSettingsRequest request,
        CancellationToken cancellationToken)
    {
        var settings = await adminService.UpdateSettingsAsync(request, cancellationToken);

        return Ok(settings);
    }
}
