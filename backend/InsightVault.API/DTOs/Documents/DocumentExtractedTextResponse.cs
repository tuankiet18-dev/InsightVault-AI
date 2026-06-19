namespace InsightVault.API.DTOs.Documents;

public sealed record DocumentExtractedTextResponse(
    Guid DocumentId,
    string FileName,
    int ChunkCount,
    string Content);
