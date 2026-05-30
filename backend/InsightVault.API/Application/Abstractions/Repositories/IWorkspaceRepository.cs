using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Application.Abstractions.Repositories;

public interface IWorkspaceRepository : IRepository<Workspace>
{
    Task<Workspace?> GetByIdWithMembersAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsActiveAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsNotDeletedAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Workspace>> ListByUserAsync(
        Guid userId,
        string? query,
        CancellationToken cancellationToken = default);

    Task<WorkspaceMember?> GetMemberAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<WorkspaceMember?> GetMemberByIdAsync(
        Guid workspaceId,
        Guid memberId,
        CancellationToken cancellationToken = default);

    Task<WorkspaceMember?> GetMemberByEmailAsync(
        Guid workspaceId,
        string email,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WorkspaceMember>> ListMembersAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<int> CountOwnerMembersAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);
}
