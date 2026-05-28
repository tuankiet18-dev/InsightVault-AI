using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Reports;

public sealed record ReportDto(
    Guid Id,
    Guid WorkspaceId,
    Guid? FolderId,
    string Title,
    ApiReportType ReportType,
    string MarkdownContent,
    IReadOnlyList<string> SourceDocuments,
    object? StructuredResult,
    string? ModelName,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
