using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Application.Abstractions.Repositories;

public interface IDocumentRepository : IRepository<Document>
{
    Task<Document?> GetByIdInWorkspaceAsync(
        Guid documentId,
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Document>> ListByWorkspaceAsync(
        Guid workspaceId,
        Guid? folderId = null,
        DocumentStatus? status = null,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Document>> ListCompletedByIdsAsync(
        Guid workspaceId,
        IReadOnlyCollection<Guid> documentIds,
        CancellationToken cancellationToken = default);

    Task<bool> ExistsInWorkspaceAsync(
        Guid documentId,
        Guid workspaceId,
        CancellationToken cancellationToken = default);
}
