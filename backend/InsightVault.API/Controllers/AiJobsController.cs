using InsightVault.API.Application.Abstractions.Services.AiJobs;
using InsightVault.API.DTOs.AiJobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightVault.API.Controllers;

[ApiController]
[Authorize]
public sealed class AiJobsController(IAiJobService aiJobService) : ControllerBase
{
    [HttpGet("api/workspaces/{workspaceId:guid}/ai-jobs")]
    public async Task<ActionResult<IReadOnlyList<AiJobDto>>> ListAiJobs(
        Guid workspaceId,
        [FromQuery] string? status,
        [FromQuery] string? type,
        CancellationToken cancellationToken)
    {
        var jobs = await aiJobService.ListByWorkspaceAsync(
            workspaceId,
            status,
            type,
            cancellationToken);

        return Ok(jobs);
    }

    [HttpGet("api/ai-jobs/{jobId:guid}")]
    public async Task<ActionResult<AiJobDto>> GetAiJob(
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var job = await aiJobService.GetByIdAsync(jobId, cancellationToken);

        return Ok(job);
    }

    [HttpPost("api/ai-jobs/{jobId:guid}/retry")]
    public async Task<ActionResult<AiJobDto>> RetryAiJob(
        Guid jobId,
        CancellationToken cancellationToken)
    {
        var job = await aiJobService.RetryAsync(jobId, cancellationToken);

        return Ok(job);
    }
}
