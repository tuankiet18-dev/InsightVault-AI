using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Documents;

public sealed record DocumentDto(
    Guid Id,
    Guid WorkspaceId,
    Guid? FolderId,
    string FileName,
    string OriginalFileName,
    string FileType,
    string? MimeType,
    long FileSizeBytes,
    ApiDocumentStatus Status,
    string? Summary,
    IReadOnlyList<string> KeyPoints,
    IReadOnlyList<string> Keywords,
    string? ProcessingError,
    DateTimeOffset? ProcessedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
