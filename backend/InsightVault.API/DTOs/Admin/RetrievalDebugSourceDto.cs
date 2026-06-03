using System.Text.Json.Nodes;

namespace InsightVault.API.DTOs.Admin;

public sealed record RetrievalDebugSourceDto(
    Guid SourceId,
    Guid ChatMessageId,
    Guid ChatSessionId,
    Guid WorkspaceId,
    Guid DocumentId,
    Guid? DocumentChunkId,
    string FileName,
    int SourceOrder,
    double? SimilarityScore,
    JsonNode? RetrievalDebug,
    JsonNode Metadata,
    DateTimeOffset CreatedAt);
