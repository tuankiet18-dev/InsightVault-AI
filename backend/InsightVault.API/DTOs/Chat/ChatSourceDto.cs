namespace InsightVault.API.DTOs.Chat;

public sealed record ChatSourceDto(
    Guid? DocumentId,
    Guid? DocumentChunkId,
    string FileName,
    string Snippet,
    double? Similarity);
