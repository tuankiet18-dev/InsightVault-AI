using Microsoft.AspNetCore.Mvc;

namespace InsightVault.API.Controllers;

[ApiController]
[Route("api/meta")]
public sealed class MetaController : ControllerBase
{
    [HttpGet]
    public ActionResult<ProjectMetaResponse> GetProjectMeta()
    {
        return Ok(new ProjectMetaResponse(
            "InsightVault AI",
            "Collaborative AI-powered knowledge workspace",
            [
                "Google OAuth",
                "Workspace member roles",
                "Document upload",
                "AI processing jobs",
                "RAG chat",
                "Document comparison",
                "Markdown reports",
                "Admin monitoring"
            ]));
    }
}

public sealed record ProjectMetaResponse(string Name, string Description, string[] MvpCapabilities);
