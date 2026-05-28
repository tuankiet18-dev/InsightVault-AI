namespace InsightVault.API.DTOs.Reports;

public sealed record CompareDocumentsResponse(
    string Objectives,
    string Scope,
    IReadOnlyList<string> Similarities,
    IReadOnlyList<string> Differences,
    IReadOnlyList<string> MissingInformation,
    IReadOnlyList<string> PotentialConflicts,
    IReadOnlyList<string> Recommendations,
    string RawMarkdown,
    Guid? ReportId);
