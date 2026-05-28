using InsightVault.API.Data;
using InsightVault.API.DTOs.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Controllers;

[ApiController]
[Route("api/health")]
public sealed class HealthController : ControllerBase
{
    [HttpGet]
    public ActionResult<HealthResponse> GetHealth()
    {
        return Ok(new HealthResponse("ok", "InsightVault API is running"));
    }

    [HttpGet("db")]
    public async Task<ActionResult<HealthResponse>> GetDatabaseHealth(
        InsightVaultDbContext db,
        CancellationToken cancellationToken)
    {
        var canConnect = await db.Database.CanConnectAsync(cancellationToken);

        if (!canConnect)
        {
            return Problem("Database connection failed");
        }

        return Ok(new HealthResponse("ok", "Database connection is healthy"));
    }
}
