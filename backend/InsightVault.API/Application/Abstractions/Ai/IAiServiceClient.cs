using InsightVault.API.Domain.Entities;

namespace InsightVault.API.Application.Abstractions.Ai;

public interface IAiServiceClient
{
    Task<ProcessDocumentResult> ProcessDocumentAsync(
        Document document,
        CancellationToken cancellationToken = default);
}

public sealed record ProcessDocumentResult(
    string Status,
    Guid DocumentId,
    int ChunkCount,
    string Summary,
    IReadOnlyList<string> KeyPoints,
    IReadOnlyList<string> Keywords,
    string? Error);
