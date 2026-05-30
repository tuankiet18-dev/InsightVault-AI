using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Abstractions.Services.Workspaces;
using InsightVault.API.DTOs.Common;
using InsightVault.API.DTOs.Workspaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightVault.API.Controllers;

[ApiController]
[Route("api/workspaces")]
[Authorize]
public sealed class WorkspacesController(
    IWorkspaceService workspaceService,
    ICurrentUserService currentUserService) : ControllerBase
{
    private Guid GetUserId() =>
        currentUserService.UserId
        ?? throw new UnauthorizedAccessException("User is not authenticated.");

    private static ObjectResult ForbiddenError(string message) =>
        new(new ApiErrorDto("auth.forbidden", message))
        {
            StatusCode = StatusCodes.Status403Forbidden
        };

    // ── Workspace CRUD ──────────────────────────────────────────────

    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<WorkspaceDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<WorkspaceDto>>> ListWorkspaces(
        [FromQuery] string? q,
        CancellationToken cancellationToken)
    {
        try
        {
            var workspaces = await workspaceService.ListWorkspacesAsync(GetUserId(), q, cancellationToken);
            return Ok(workspaces);
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new ApiErrorDto("auth.unauthorized", ex.Message));
        }
    }

    [HttpPost]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(WorkspaceDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<WorkspaceDto>> CreateWorkspace(
        CreateWorkspaceRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var workspace = await workspaceService.CreateWorkspaceAsync(GetUserId(), request, cancellationToken);
            return CreatedAtAction(nameof(GetWorkspace), new { workspaceId = workspace.Id }, workspace);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiErrorDto("workspace.invalid_request", ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return Unauthorized(new ApiErrorDto("auth.unauthorized", ex.Message));
        }
    }

    [HttpGet("{workspaceId:guid}")]
    [ProducesResponseType(typeof(WorkspaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkspaceDto>> GetWorkspace(
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        try
        {
            var workspace = await workspaceService.GetWorkspaceAsync(workspaceId, GetUserId(), cancellationToken);
            return Ok(workspace);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenError(ex.Message);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorDto("workspace.not_found", "Workspace not found."));
        }
    }

    [HttpPatch("{workspaceId:guid}")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(WorkspaceDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WorkspaceDto>> UpdateWorkspace(
        Guid workspaceId,
        UpdateWorkspaceRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var workspace = await workspaceService.UpdateWorkspaceAsync(
                workspaceId, GetUserId(), request, cancellationToken);
            return Ok(workspace);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiErrorDto("workspace.invalid_request", ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenError(ex.Message);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorDto("workspace.not_found", "Workspace not found."));
        }
    }

    [HttpDelete("{workspaceId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteWorkspace(
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        try
        {
            await workspaceService.DeleteWorkspaceAsync(workspaceId, GetUserId(), cancellationToken);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenError(ex.Message);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorDto("workspace.not_found", "Workspace not found."));
        }
    }

    // ── Member Management ───────────────────────────────────────────

    [HttpGet("{workspaceId:guid}/members")]
    [ProducesResponseType(typeof(IReadOnlyList<WorkspaceMemberDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<WorkspaceMemberDto>>> ListMembers(
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        try
        {
            var members = await workspaceService.ListMembersAsync(workspaceId, GetUserId(), cancellationToken);
            return Ok(members);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenError(ex.Message);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorDto("workspace.not_found", "Workspace not found."));
        }
    }

    [HttpPost("{workspaceId:guid}/members")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(WorkspaceMemberDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<WorkspaceMemberDto>> AddMember(
        Guid workspaceId,
        AddWorkspaceMemberRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var member = await workspaceService.AddMemberAsync(
                workspaceId, GetUserId(), request, cancellationToken);
            return CreatedAtAction(nameof(ListMembers), new { workspaceId }, member);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiErrorDto("member.invalid_request", ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenError(ex.Message);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorDto("workspace.not_found", "Workspace not found."));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ApiErrorDto("member.duplicate", ex.Message));
        }
    }

    [HttpPatch("{workspaceId:guid}/members/{memberId:guid}")]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(WorkspaceMemberDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<WorkspaceMemberDto>> UpdateMember(
        Guid workspaceId,
        Guid memberId,
        UpdateWorkspaceMemberRequest request,
        CancellationToken cancellationToken)
    {
        try
        {
            var member = await workspaceService.UpdateMemberAsync(
                workspaceId, memberId, GetUserId(), request, cancellationToken);
            return Ok(member);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new ApiErrorDto("member.invalid_request", ex.Message));
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenError(ex.Message);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorDto("member.not_found", "Workspace member not found."));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ApiErrorDto("member.conflict", ex.Message));
        }
    }

    [HttpDelete("{workspaceId:guid}/members/{memberId:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiErrorDto), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RemoveMember(
        Guid workspaceId,
        Guid memberId,
        CancellationToken cancellationToken)
    {
        try
        {
            await workspaceService.RemoveMemberAsync(workspaceId, memberId, GetUserId(), cancellationToken);
            return NoContent();
        }
        catch (UnauthorizedAccessException ex)
        {
            return ForbiddenError(ex.Message);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new ApiErrorDto("member.not_found", "Workspace member not found."));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new ApiErrorDto("member.conflict", ex.Message));
        }
    }
}
