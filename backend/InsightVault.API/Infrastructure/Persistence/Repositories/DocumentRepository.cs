using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Infrastructure.Persistence.Repositories;

// Specific repository: document queries need workspace/folder/status filters and soft-delete rules.
public sealed class DocumentRepository(InsightVaultDbContext db)
    : GenericRepository<Document>(db), IDocumentRepository
{
    public async Task<Document?> GetByIdInWorkspaceAsync(
        Guid documentId,
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Documents
            .FirstOrDefaultAsync(
                document => document.Id == documentId
                    && document.WorkspaceId == workspaceId
                    && document.DeletedAt == null,
                cancellationToken);
    }

    public async Task<IReadOnlyList<Document>> ListByWorkspaceAsync(
        Guid workspaceId,
        Guid? folderId = null,
        DocumentStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        var query = Db.Documents
            .AsNoTracking()
            .Where(document => document.WorkspaceId == workspaceId && document.DeletedAt == null);

        if (folderId.HasValue)
        {
            query = query.Where(document => document.FolderId == folderId.Value);
        }

        if (status.HasValue)
        {
            query = query.Where(document => document.Status == status.Value);
        }

        return await query
            .OrderByDescending(document => document.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Document>> ListCompletedByIdsAsync(
        Guid workspaceId,
        IReadOnlyCollection<Guid> documentIds,
        CancellationToken cancellationToken = default)
    {
        return await Db.Documents
            .AsNoTracking()
            .Where(document => document.WorkspaceId == workspaceId
                && documentIds.Contains(document.Id)
                && document.Status == DocumentStatus.Completed
                && document.DeletedAt == null)
            .OrderBy(document => document.OriginalFileName)
            .ToListAsync(cancellationToken);
    }

    public async Task<bool> ExistsInWorkspaceAsync(
        Guid documentId,
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Documents.AnyAsync(
            document => document.Id == documentId
                && document.WorkspaceId == workspaceId
                && document.DeletedAt == null,
            cancellationToken);
    }
}
