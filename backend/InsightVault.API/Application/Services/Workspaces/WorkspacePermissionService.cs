using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Application.Abstractions.Services.Workspaces;
using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Application.Services.Workspaces;

public sealed class WorkspacePermissionService(
    IWorkspaceRepository workspaceRepository) : IWorkspacePermissionService
{
    private async Task<WorkspaceRole?> GetExistingWorkspaceRoleAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var exists = await workspaceRepository.ExistsNotDeletedAsync(workspaceId, cancellationToken);
        if (!exists)
        {
            throw new KeyNotFoundException("Workspace not found.");
        }

        return await GetUserRoleAsync(workspaceId, userId, cancellationToken);
    }

    public async Task<WorkspaceRole?> GetUserRoleAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var member = await workspaceRepository.GetMemberAsync(workspaceId, userId, cancellationToken);
        if (member is null || member.Status != MemberStatus.Active)
        {
            return null;
        }

        return member.Role;
    }

    public async Task<bool> IsActiveMemberAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var role = await GetUserRoleAsync(workspaceId, userId, cancellationToken);
        return role.HasValue;
    }

    public async Task EnsureCanReadWorkspaceAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var role = await GetExistingWorkspaceRoleAsync(workspaceId, userId, cancellationToken);
        if (!role.HasValue)
        {
            throw new UnauthorizedAccessException("You are not an active member of this workspace.");
        }
    }

    public async Task EnsureCanManageWorkspaceAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var role = await GetExistingWorkspaceRoleAsync(workspaceId, userId, cancellationToken);
        if (role != WorkspaceRole.Owner)
        {
            throw new UnauthorizedAccessException("Only the workspace owner can manage workspace settings.");
        }
    }

    public async Task EnsureCanManageMembersAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var role = await GetExistingWorkspaceRoleAsync(workspaceId, userId, cancellationToken);
        if (role != WorkspaceRole.Owner)
        {
            throw new UnauthorizedAccessException("Only the workspace owner can manage members.");
        }
    }

    public async Task EnsureCanMutateWorkspaceContentAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var role = await GetExistingWorkspaceRoleAsync(workspaceId, userId, cancellationToken);
        if (role is not (WorkspaceRole.Owner or WorkspaceRole.Editor))
        {
            throw new UnauthorizedAccessException("You do not have permission to modify content in this workspace.");
        }
    }
}
