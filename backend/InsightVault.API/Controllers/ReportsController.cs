using InsightVault.API.Application.Abstractions.Services.Reports;
using InsightVault.API.DTOs.AiJobs;
using InsightVault.API.DTOs.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightVault.API.Controllers;

[ApiController]
[Authorize]
public sealed class ReportsController(IReportService reportService) : ControllerBase
{
    [HttpGet("api/workspaces/{workspaceId:guid}/reports")]
    public async Task<ActionResult<IReadOnlyList<ReportDto>>> ListReports(
        Guid workspaceId,
        [FromQuery] string? type,
        CancellationToken cancellationToken)
    {
        var reports = await reportService.ListByWorkspaceAsync(
            workspaceId,
            type,
            cancellationToken);

        return Ok(reports);
    }

    [HttpGet("api/reports/{reportId:guid}")]
    public async Task<ActionResult<ReportDto>> GetReport(
        Guid reportId,
        CancellationToken cancellationToken)
    {
        var report = await reportService.GetByIdAsync(reportId, cancellationToken);

        return Ok(report);
    }

    [HttpPost("api/workspaces/{workspaceId:guid}/reports/generate")]
    public async Task<ActionResult<AiJobDto>> GenerateReport(
        Guid workspaceId,
        GenerateReportRequest request,
        CancellationToken cancellationToken)
    {
        var job = await reportService.EnqueueReportGenerationAsync(
            workspaceId,
            request,
            cancellationToken);

        return AcceptedAtAction(
            nameof(AiJobsController.GetAiJob),
            "AiJobs",
            new { jobId = job.Id },
            job);
    }

    [HttpPost("api/workspaces/{workspaceId:guid}/compare")]
    public async Task<ActionResult<AiJobDto>> CompareDocuments(
        Guid workspaceId,
        CompareDocumentsRequest request,
        CancellationToken cancellationToken)
    {
        var job = await reportService.EnqueueCompareAsync(
            workspaceId,
            request,
            cancellationToken);

        return AcceptedAtAction(
            nameof(AiJobsController.GetAiJob),
            "AiJobs",
            new { jobId = job.Id },
            job);
    }

    [HttpDelete("api/reports/{reportId:guid}")]
    public async Task<IActionResult> DeleteReport(
        Guid reportId,
        CancellationToken cancellationToken)
    {
        await reportService.DeleteAsync(reportId, cancellationToken);

        return NoContent();
    }
}
