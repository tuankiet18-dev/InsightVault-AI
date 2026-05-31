using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Infrastructure.Persistence.Repositories;

// Specific repository: folder queries need hierarchy, sibling-name checks, and soft-delete rules.
public sealed class FolderRepository(InsightVaultDbContext db)
    : GenericRepository<Folder>(db), IFolderRepository
{
    public async Task<Folder?> GetByIdInWorkspaceAsync(
        Guid folderId,
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Folders
            .FirstOrDefaultAsync(
                folder => folder.Id == folderId
                    && folder.WorkspaceId == workspaceId
                    && folder.DeletedAt == null,
                cancellationToken);
    }

    public async Task<IReadOnlyList<Folder>> ListByWorkspaceAsync(
        Guid workspaceId,
        Guid? parentFolderId = null,
        CancellationToken cancellationToken = default)
    {
        return await Db.Folders
            .AsNoTracking()
            .Where(folder => folder.WorkspaceId == workspaceId
                && folder.ParentFolderId == parentFolderId
                && folder.DeletedAt == null)
            .OrderBy(folder => folder.Name)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Folder>> ListActiveByWorkspaceAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Folders
            .Where(folder => folder.WorkspaceId == workspaceId
                && folder.DeletedAt == null)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsInWorkspaceAsync(
        Guid folderId,
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Folders.AnyAsync(
            folder => folder.Id == folderId
                && folder.WorkspaceId == workspaceId
                && folder.DeletedAt == null,
            cancellationToken);
    }

    public async Task<bool> HasSiblingWithNameAsync(
        Guid workspaceId,
        Guid? parentFolderId,
        string name,
        Guid? excludedFolderId = null,
        CancellationToken cancellationToken = default)
    {
        var normalizedName = name.Trim();

        return await Db.Folders.AnyAsync(
            folder => folder.WorkspaceId == workspaceId
                && folder.ParentFolderId == parentFolderId
                && folder.Name == normalizedName
                && folder.DeletedAt == null
                && (!excludedFolderId.HasValue || folder.Id != excludedFolderId.Value),
            cancellationToken);
    }
}
