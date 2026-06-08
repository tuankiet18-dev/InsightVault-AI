using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Application.Abstractions.Services.Workspaces;
using InsightVault.API.Common.Errors;
using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Application.Services.Workspaces;

public sealed class WorkspacePermissionService(
    IWorkspaceRepository workspaceRepository,
    IUserRepository userRepository) : IWorkspacePermissionService
{
    private async Task<WorkspaceRole?> GetExistingWorkspaceRoleAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        if (!await IsWorkspaceContentUserAsync(userId, cancellationToken))
        {
            return null;
        }

        var exists = await workspaceRepository.ExistsNotDeletedAsync(workspaceId, cancellationToken);
        if (!exists)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "workspace.not_found",
                "Workspace not found.");
        }

        return await GetUserRoleAsync(workspaceId, userId, cancellationToken);
    }

    public async Task<WorkspaceRole?> GetUserRoleAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (!await IsWorkspaceContentUserAsync(userId, cancellationToken))
        {
            return null;
        }

        var member = await workspaceRepository.GetMemberAsync(workspaceId, userId, cancellationToken);
        if (member is null || member.Status != MemberStatus.Active)
        {
            return null;
        }

        return member.Role;
    }

    private async Task<bool> IsWorkspaceContentUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken);
        return user is { IsActive: true, SystemRole: not SystemRole.Admin };
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
            throw new ApiException(
                StatusCodes.Status403Forbidden,
                "workspace.forbidden",
                "You do not have access to this workspace.");
        }
    }

    public Task EnsureCanViewWorkspaceAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return EnsureCanReadWorkspaceAsync(workspaceId, userId, cancellationToken);
    }

    public async Task EnsureCanManageWorkspaceAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var role = await GetExistingWorkspaceRoleAsync(workspaceId, userId, cancellationToken);
        if (role != WorkspaceRole.Owner)
        {
            throw new ApiException(
                StatusCodes.Status403Forbidden,
                "workspace.insufficient_role",
                "Only the workspace owner can manage workspace settings.");
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
            throw new ApiException(
                StatusCodes.Status403Forbidden,
                "workspace.insufficient_role",
                "Only the workspace owner can manage members.");
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
            throw new ApiException(
                StatusCodes.Status403Forbidden,
                "workspace.insufficient_role",
                "Only workspace owners and editors can modify workspace content.");
        }
    }

    public Task EnsureCanManageFoldersAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return EnsureCanMutateWorkspaceContentAsync(workspaceId, userId, cancellationToken);
    }

    public Task EnsureCanManageDocumentsAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return EnsureCanMutateWorkspaceContentAsync(workspaceId, userId, cancellationToken);
    }

    public async Task EnsureCanDeleteDocumentAsync(
        Guid workspaceId,
        Guid? uploadedById,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        var role = await GetExistingWorkspaceRoleAsync(workspaceId, userId, cancellationToken);
        var canDelete = role == WorkspaceRole.Owner
            || role == WorkspaceRole.Editor && uploadedById == userId;

        if (!canDelete)
        {
            throw new ApiException(
                StatusCodes.Status403Forbidden,
                "document.delete_forbidden",
                "Only the workspace owner or the editor who uploaded this document can delete it.");
        }
    }
}
