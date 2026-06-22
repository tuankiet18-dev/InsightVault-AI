using InsightVault.API.Application.Abstractions.Services.Reports;
using InsightVault.API.DTOs.Reports;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightVault.API.Controllers;

[ApiController]
public sealed class PublicReportsController(IReportService reportService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("api/public/reports/{publicToken}")]
    public async Task<ActionResult<ReportDto>> GetPublicReport(
        string publicToken,
        CancellationToken cancellationToken)
    {
        var report = await reportService.GetPublicReportAsync(publicToken, cancellationToken);
        return Ok(report);
    }
}
