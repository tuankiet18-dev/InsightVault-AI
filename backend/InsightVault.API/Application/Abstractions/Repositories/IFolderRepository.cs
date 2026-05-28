using InsightVault.API.Domain.Entities;

namespace InsightVault.API.Application.Abstractions.Repositories;

public interface IFolderRepository : IRepository<Folder>
{
    Task<Folder?> GetByIdInWorkspaceAsync(
        Guid folderId,
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Folder>> ListByWorkspaceAsync(
        Guid workspaceId,
        Guid? parentFolderId = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Folder>> ListActiveByWorkspaceAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsInWorkspaceAsync(
        Guid folderId,
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<bool> HasSiblingWithNameAsync(
        Guid workspaceId,
        Guid? parentFolderId,
        string name,
        Guid? excludedFolderId = null,
        CancellationToken cancellationToken = default);
}
