namespace InsightVault.API.Application.Services.Reports;

public sealed record ReportJobPayload(
    Guid WorkspaceId,
    Guid? FolderId,
    Guid? CreatedById,
    IReadOnlyList<Guid> DocumentIds,
    IReadOnlyList<string> DocumentNames,
    string? Title,
    string? CustomPrompt,
    string? ReportType,
    bool StoreReport);
