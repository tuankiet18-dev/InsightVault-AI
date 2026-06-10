using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Reports;

public sealed record GenerateReportRequest(
    Guid? FolderId,
    Guid? ReportGroupId,
    IReadOnlyList<Guid> DocumentIds,
    ApiReportType ReportType,
    string? Title,
    string? CustomPrompt,
    bool? StoreReport,
    WebSearchOptionsDto? WebSearchOptions);
