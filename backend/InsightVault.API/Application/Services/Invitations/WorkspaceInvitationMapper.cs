using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.Application.Services.Workspaces;
using InsightVault.API.DTOs.Common;
using InsightVault.API.DTOs.Invitations;

namespace InsightVault.API.Application.Services.Invitations;

public static class WorkspaceInvitationMapper
{
    public static WorkspaceInvitationDto ToDto(WorkspaceInvitation invitation)
    {
        return new WorkspaceInvitationDto(
            invitation.Id,
            invitation.WorkspaceId,
            invitation.Workspace.Name,
            invitation.InvitedUserId,
            invitation.Email,
            WorkspaceMapper.ToApiWorkspaceRole(invitation.Role),
            ToApiInvitationStatus(invitation.Status),
            invitation.InvitedById,
            invitation.InvitedBy?.FullName,
            invitation.ExpiresAt,
            invitation.AcceptedAt,
            invitation.DeclinedAt,
            invitation.CancelledAt,
            invitation.CreatedAt,
            invitation.UpdatedAt);
    }

    private static ApiWorkspaceInvitationStatus ToApiInvitationStatus(WorkspaceInvitationStatus status)
    {
        return status switch
        {
            WorkspaceInvitationStatus.Accepted => ApiWorkspaceInvitationStatus.Accepted,
            WorkspaceInvitationStatus.Declined => ApiWorkspaceInvitationStatus.Declined,
            WorkspaceInvitationStatus.Expired => ApiWorkspaceInvitationStatus.Expired,
            WorkspaceInvitationStatus.Cancelled => ApiWorkspaceInvitationStatus.Cancelled,
            _ => ApiWorkspaceInvitationStatus.Pending
        };
    }
}
