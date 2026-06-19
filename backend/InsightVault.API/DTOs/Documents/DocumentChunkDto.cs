namespace InsightVault.API.DTOs.Documents;

public sealed record DocumentChunkDto(
    Guid Id,
    Guid DocumentId,
    Guid WorkspaceId,
    Guid? FolderId,
    int ChunkIndex,
    string Content,
    int? TokenCount,
    int? CharStart,
    int? CharEnd,
    string EmbeddingModel,
    string Metadata,
    DateTimeOffset CreatedAt);
