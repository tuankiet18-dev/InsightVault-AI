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
<<<<<<< HEAD
=======

    Task EnsureCanManageDocumentsAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);
>>>>>>> f07e3099f33f1c4031dd5f119fd1f7345fb5b495
}
