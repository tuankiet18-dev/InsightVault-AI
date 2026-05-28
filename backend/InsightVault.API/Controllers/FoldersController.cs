using InsightVault.API.Application.Abstractions.Services.Folders;
using InsightVault.API.DTOs.Folders;
using Microsoft.AspNetCore.Mvc;

namespace InsightVault.API.Controllers;

[ApiController]
public sealed class FoldersController(IFolderService folderService) : ControllerBase
{
    [HttpGet("api/workspaces/{workspaceId:guid}/folders")]
    public async Task<ActionResult<IReadOnlyList<FolderDto>>> ListFolders(
        Guid workspaceId,
        [FromQuery] Guid? parentFolderId,
        CancellationToken cancellationToken)
    {
        var folders = await folderService.ListByWorkspaceAsync(
            workspaceId,
            parentFolderId,
            cancellationToken);

        return Ok(folders);
    }

    [HttpPost("api/workspaces/{workspaceId:guid}/folders")]
    public async Task<ActionResult<FolderDto>> CreateFolder(
        Guid workspaceId,
        CreateFolderRequest request,
        CancellationToken cancellationToken)
    {
        var folder = await folderService.CreateAsync(workspaceId, request, cancellationToken);

        return CreatedAtAction(nameof(GetFolder), new { folderId = folder.Id }, folder);
    }

    [HttpGet("api/folders/{folderId:guid}")]
    public async Task<ActionResult<FolderDto>> GetFolder(
        Guid folderId,
        CancellationToken cancellationToken)
    {
        var folder = await folderService.GetByIdAsync(folderId, cancellationToken);

        return Ok(folder);
    }

    [HttpPatch("api/folders/{folderId:guid}")]
    public async Task<ActionResult<FolderDto>> UpdateFolder(
        Guid folderId,
        UpdateFolderRequest request,
        CancellationToken cancellationToken)
    {
        var folder = await folderService.UpdateAsync(folderId, request, cancellationToken);

        return Ok(folder);
    }

    [HttpDelete("api/folders/{folderId:guid}")]
    public async Task<IActionResult> DeleteFolder(
        Guid folderId,
        CancellationToken cancellationToken)
    {
        await folderService.DeleteAsync(folderId, cancellationToken);

        return NoContent();
    }
}
