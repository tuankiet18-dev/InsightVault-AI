using InsightVault.API.Application.Abstractions.Services.Invitations;
using InsightVault.API.DTOs.Invitations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightVault.API.Controllers;

[ApiController]
[Authorize]
public sealed class WorkspaceInvitationsController(
    IWorkspaceInvitationService invitationService) : ControllerBase
{
    [HttpPost("api/workspaces/{workspaceId:guid}/invitations")]
    public async Task<ActionResult<WorkspaceInvitationDto>> Create(
        Guid workspaceId,
        CreateWorkspaceInvitationRequest request,
        CancellationToken cancellationToken)
    {
        var invitation = await invitationService.CreateAsync(
            workspaceId,
            request,
            cancellationToken);

        return StatusCode(StatusCodes.Status201Created, invitation);
    }

    [HttpGet("api/me/workspace-invitations")]
    public async Task<ActionResult<IReadOnlyList<WorkspaceInvitationDto>>> ListForCurrentUser(
        CancellationToken cancellationToken)
    {
        var invitations = await invitationService.ListForCurrentUserAsync(cancellationToken);
        return Ok(invitations);
    }

    [HttpGet("api/me/workspace-invitations/{invitationId:guid}")]
    public async Task<ActionResult<WorkspaceInvitationDto>> GetForCurrentUser(
        Guid invitationId,
        CancellationToken cancellationToken)
    {
        var invitation = await invitationService.GetForCurrentUserAsync(
            invitationId,
            cancellationToken);

        return Ok(invitation);
    }

    [HttpPost("api/me/workspace-invitations/{invitationId:guid}/accept")]
    public async Task<ActionResult<WorkspaceInvitationDto>> Accept(
        Guid invitationId,
        CancellationToken cancellationToken)
    {
        var invitation = await invitationService.AcceptAsync(
            invitationId,
            cancellationToken);

        return Ok(invitation);
    }

    [HttpPost("api/me/workspace-invitations/{invitationId:guid}/decline")]
    public async Task<ActionResult<WorkspaceInvitationDto>> Decline(
        Guid invitationId,
        CancellationToken cancellationToken)
    {
        var invitation = await invitationService.DeclineAsync(
            invitationId,
            cancellationToken);

        return Ok(invitation);
    }

    [HttpGet("api/workspaces/{workspaceId:guid}/invitations")]
    public async Task<ActionResult<IReadOnlyList<WorkspaceInvitationDto>>> ListByWorkspace(
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        var invitations = await invitationService.ListByWorkspaceAsync(
            workspaceId,
            cancellationToken);

        return Ok(invitations);
    }
}
