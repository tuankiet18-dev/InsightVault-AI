using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Documents;

public sealed record DocumentDto(
    Guid Id,
    Guid WorkspaceId,
    Guid? FolderId,
    Guid? UploadedById,
    string FileName,
    string OriginalFileName,
    string FileType,
    string? MimeType,
    long FileSizeBytes,
    ApiDocumentStatus Status,
    string? DocumentType,
    double? DocumentTypeConfidence,
    string? AudienceFit,
    string? Summary,
    IReadOnlyList<string> KeyPoints,
    DocumentInsightsDto Insights,
    IReadOnlyList<string> Keywords,
    string? ProcessingError,
    DateTimeOffset? ProcessedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record DocumentInsightsDto(
    IReadOnlyList<string> Scope,
    IReadOnlyList<string> Decisions,
    IReadOnlyList<string> Risks,
    IReadOnlyList<string> Gaps,
    IReadOnlyList<string> NextActions);
