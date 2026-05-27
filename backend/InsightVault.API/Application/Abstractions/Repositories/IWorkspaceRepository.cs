using InsightVault.API.Domain.Entities;

namespace InsightVault.API.Application.Abstractions.Repositories;

public interface IWorkspaceRepository : IRepository<Workspace>
{
    Task<Workspace?> GetByIdWithMembersAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsActiveAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);
}
