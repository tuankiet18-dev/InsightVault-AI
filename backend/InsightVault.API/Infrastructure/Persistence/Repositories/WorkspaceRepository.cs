using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
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

    public async Task<bool> ExistsNotDeletedAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Workspaces.AnyAsync(
            workspace => workspace.Id == workspaceId
                && workspace.DeletedAt == null,
            cancellationToken);
    }

    public async Task<IReadOnlyList<Workspace>> ListByUserAsync(
        Guid userId,
        string? query,
        CancellationToken cancellationToken = default)
    {
        var q = Db.Workspaces
            .AsNoTracking()
            .Where(w => w.DeletedAt == null
                && w.Members.Any(m => m.UserId == userId
                    && m.Status == MemberStatus.Active));

        if (!string.IsNullOrWhiteSpace(query))
        {
            var normalizedQuery = query.Trim().ToLowerInvariant();
            q = q.Where(w => w.Name.ToLower().Contains(normalizedQuery));
        }

        return await q.OrderByDescending(w => w.UpdatedAt).ToListAsync(cancellationToken);
    }

    public async Task<WorkspaceMember?> GetMemberAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await Db.WorkspaceMembers
            .Include(m => m.Workspace)
            .FirstOrDefaultAsync(
                m => m.WorkspaceId == workspaceId
                    && m.Workspace.DeletedAt == null
                    && m.UserId == userId
                    && m.Status != MemberStatus.Removed,
                cancellationToken);
    }

    public async Task<WorkspaceMember?> GetMemberByIdAsync(
        Guid workspaceId,
        Guid memberId,
        CancellationToken cancellationToken = default)
    {
        return await Db.WorkspaceMembers
            .FirstOrDefaultAsync(
                m => m.WorkspaceId == workspaceId
                    && m.Id == memberId
                    && m.Status != MemberStatus.Removed,
                cancellationToken);
    }

    public async Task<WorkspaceMember?> GetMemberByEmailAsync(
        Guid workspaceId,
        string email,
        CancellationToken cancellationToken = default)
    {
        var normalizedEmail = email.Trim().ToLowerInvariant();
        return await Db.WorkspaceMembers
            .FirstOrDefaultAsync(
                m => m.WorkspaceId == workspaceId
                    && m.Email == normalizedEmail,
                cancellationToken);
    }

    public async Task<IReadOnlyList<WorkspaceMember>> ListMembersAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        return await Db.WorkspaceMembers
            .AsNoTracking()
            .Where(m => m.WorkspaceId == workspaceId
                && m.Status != MemberStatus.Removed)
            .OrderBy(m => m.InvitedAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<int> CountOwnerMembersAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        return await Db.WorkspaceMembers
            .CountAsync(
                m => m.WorkspaceId == workspaceId
                    && m.Role == WorkspaceRole.Owner
                    && m.Status != MemberStatus.Removed,
                cancellationToken);
    }
}

