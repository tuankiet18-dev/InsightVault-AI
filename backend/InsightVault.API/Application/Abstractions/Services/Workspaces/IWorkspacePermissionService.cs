using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Application.Abstractions.Services.Workspaces;

public interface IWorkspacePermissionService
{
    Task<WorkspaceRole?> GetUserRoleAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<bool> IsActiveMemberAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task EnsureCanReadWorkspaceAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task EnsureCanManageWorkspaceAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task EnsureCanManageMembersAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task EnsureCanMutateWorkspaceContentAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);
}
