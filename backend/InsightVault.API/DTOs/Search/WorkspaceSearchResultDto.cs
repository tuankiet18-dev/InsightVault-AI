namespace InsightVault.API.DTOs.Search;

public sealed record WorkspaceSearchResultDto(
    string Type,
    string Title,
    string? Subtitle,
    string? Snippet,
    Guid? DocumentId,
    Guid? DocumentChunkId,
    Guid? ReportId,
    int? ChunkIndex,
    DateTimeOffset UpdatedAt);
