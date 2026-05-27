using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Application.Abstractions.Repositories;

public interface IAiJobRepository : IRepository<AiJob>
{
    Task<AiJob?> GetByIdInWorkspaceAsync(
        Guid jobId,
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AiJob>> ListRecentByWorkspaceAsync(
        Guid workspaceId,
        int limit = 20,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<AiJob>> ListByStatusAsync(
        AiJobStatus status,
        int limit = 20,
        CancellationToken cancellationToken = default);
}
