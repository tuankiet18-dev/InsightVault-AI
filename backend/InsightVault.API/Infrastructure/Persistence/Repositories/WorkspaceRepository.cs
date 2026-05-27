using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Infrastructure.Persistence.Repositories;

// Specific repository: workspace queries commonly need active-state and member loading.
public sealed class WorkspaceRepository(InsightVaultDbContext db)
    : GenericRepository<Workspace>(db), IWorkspaceRepository
{
    public async Task<Workspace?> GetByIdWithMembersAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Workspaces
            .Include(workspace => workspace.Members)
            .FirstOrDefaultAsync(
                workspace => workspace.Id == workspaceId && workspace.DeletedAt == null,
                cancellationToken);
    }

    public async Task<bool> ExistsActiveAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Workspaces.AnyAsync(
            workspace => workspace.Id == workspaceId
                && !workspace.IsArchived
                && workspace.DeletedAt == null,
            cancellationToken);
    }
}
