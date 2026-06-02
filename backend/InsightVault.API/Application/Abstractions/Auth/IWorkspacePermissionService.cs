namespace InsightVault.API.Application.Abstractions.Auth;

public interface IWorkspacePermissionService
{
    Task EnsureCanViewWorkspaceAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task EnsureCanManageFoldersAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task EnsureCanManageDocumentsAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);
}
