using InsightVault.API.Domain.Entities;

namespace InsightVault.API.Application.Abstractions.Repositories;

public interface IWorkspaceInvitationRepository : IRepository<WorkspaceInvitation>
{
    Task<WorkspaceInvitation?> GetForCurrentUserAsync(
        Guid invitationId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<WorkspaceInvitation?> GetByIdWithDetailsAsync(
        Guid invitationId,
        CancellationToken cancellationToken = default);

    Task<WorkspaceInvitation?> GetPendingByWorkspaceAndUserAsync(
        Guid workspaceId,
        Guid invitedUserId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WorkspaceInvitation>> ListPendingByUserAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WorkspaceInvitation>> ListByWorkspaceAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);
}
