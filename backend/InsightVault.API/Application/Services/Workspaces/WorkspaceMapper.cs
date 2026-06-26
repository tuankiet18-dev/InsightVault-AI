using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.DTOs.Common;
using InsightVault.API.DTOs.Workspaces;

namespace InsightVault.API.Application.Services.Workspaces;

internal static class WorkspaceMapper
{
    public static WorkspaceDto ToDto(Workspace workspace, WorkspaceRole currentUserRole)
    {
        return new WorkspaceDto(
            workspace.Id,
            workspace.OwnerId,
            workspace.Name,
            workspace.Description,
            workspace.IsArchived,
            ToApiWorkspaceRole(currentUserRole),
            workspace.Subscription?.Plan?.Code,
            workspace.Subscription?.Plan?.Name,
            workspace.CreatedAt,
            workspace.UpdatedAt);
    }

    public static WorkspaceMemberDto ToMemberDto(WorkspaceMember member)
    {
        return new WorkspaceMemberDto(
            member.Id,
            member.WorkspaceId,
            member.UserId,
            member.Email,
            member.User?.FullName,
            member.User?.AvatarUrl,
            ToApiWorkspaceRole(member.Role),
            ToApiMemberStatus(member.Status),
            member.InvitedById,
            member.InvitedAt,
            member.JoinedAt);
    }

    public static ApiWorkspaceRole ToApiWorkspaceRole(WorkspaceRole role)
    {
        return role switch
        {
            WorkspaceRole.Owner => ApiWorkspaceRole.Owner,
            WorkspaceRole.Editor => ApiWorkspaceRole.Editor,
            _ => ApiWorkspaceRole.Viewer
        };
    }

    public static WorkspaceRole ToDomainRole(ApiWorkspaceRole role)
    {
        return role switch
        {
            ApiWorkspaceRole.Owner => WorkspaceRole.Owner,
            ApiWorkspaceRole.Editor => WorkspaceRole.Editor,
            _ => WorkspaceRole.Viewer
        };
    }

    public static ApiMemberStatus ToApiMemberStatus(MemberStatus status)
    {
        return status switch
        {
            MemberStatus.Active => ApiMemberStatus.Active,
            MemberStatus.Removed => ApiMemberStatus.Removed,
            _ => ApiMemberStatus.Invited
        };
    }

    public static MemberStatus ToDomainStatus(ApiMemberStatus status)
    {
        return status switch
        {
            ApiMemberStatus.Active => MemberStatus.Active,
            ApiMemberStatus.Removed => MemberStatus.Removed,
            _ => MemberStatus.Invited
        };
    }
}
