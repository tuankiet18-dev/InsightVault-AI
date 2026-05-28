using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Reports;

public sealed record CompareDocumentsRequest(
    Guid? FolderId,
    IReadOnlyList<Guid> DocumentIds,
    string? Title,
    bool? StoreReport,
    WebSearchOptionsDto? WebSearchOptions);
