using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Infrastructure.Persistence.Repositories;

public sealed class WorkspaceInvitationRepository(InsightVaultDbContext db)
    : GenericRepository<WorkspaceInvitation>(db), IWorkspaceInvitationRepository
{
    public async Task<WorkspaceInvitation?> GetForCurrentUserAsync(
        Guid invitationId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await QueryWithDetails()
            .FirstOrDefaultAsync(
                invitation => invitation.Id == invitationId
                    && invitation.InvitedUserId == userId,
                cancellationToken);
    }

    public async Task<WorkspaceInvitation?> GetByIdWithDetailsAsync(
        Guid invitationId,
        CancellationToken cancellationToken = default)
    {
        return await QueryWithDetails()
            .FirstOrDefaultAsync(
                invitation => invitation.Id == invitationId,
                cancellationToken);
    }

    public async Task<WorkspaceInvitation?> GetPendingByWorkspaceAndUserAsync(
        Guid workspaceId,
        Guid invitedUserId,
        CancellationToken cancellationToken = default)
    {
        return await QueryWithDetails()
            .FirstOrDefaultAsync(
                invitation => invitation.WorkspaceId == workspaceId
                    && invitation.InvitedUserId == invitedUserId
                    && invitation.Status == WorkspaceInvitationStatus.Pending,
                cancellationToken);
    }

    public async Task<IReadOnlyList<WorkspaceInvitation>> ListPendingByUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        return await QueryWithDetails()
            .AsNoTracking()
            .Where(invitation => invitation.InvitedUserId == userId
                && invitation.Status == WorkspaceInvitationStatus.Pending)
            .OrderBy(invitation => invitation.ExpiresAt)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<WorkspaceInvitation>> ListByWorkspaceAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        return await QueryWithDetails()
            .AsNoTracking()
            .Where(invitation => invitation.WorkspaceId == workspaceId)
            .OrderByDescending(invitation => invitation.CreatedAt)
            .ToListAsync(cancellationToken);
    }

    private IQueryable<WorkspaceInvitation> QueryWithDetails()
    {
        return Db.WorkspaceInvitations
            .Include(invitation => invitation.Workspace)
            .Include(invitation => invitation.InvitedBy);
    }
}
