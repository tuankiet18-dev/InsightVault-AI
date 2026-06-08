using InsightVault.API.Domain.Entities;

namespace InsightVault.API.Application.Abstractions.Ai;

public interface IAiServiceClient
{
    Task<ProcessDocumentResult> ProcessDocumentAsync(
        Document document,
        CancellationToken cancellationToken = default);

    Task<GenerateReportResult> GenerateReportAsync(
        GenerateReportAiRequest request,
        CancellationToken cancellationToken = default);

    Task<CompareDocumentsResult> CompareDocumentsAsync(
        CompareDocumentsAiRequest request,
        CancellationToken cancellationToken = default);
}

public sealed record ProcessDocumentResult(
    string Status,
    Guid DocumentId,
    int ChunkCount,
    string Summary,
    IReadOnlyList<string> KeyPoints,
    IReadOnlyList<string> Keywords,
    string? Error);

public sealed record GenerateReportAiRequest(
    Guid WorkspaceId,
    Guid? FolderId,
    Guid? CreatedById,
    Guid AiJobId,
    IReadOnlyList<Guid> DocumentIds,
    string ReportType,
    string? Title,
    string? CustomPrompt,
    bool StoreReport);

public sealed record GenerateReportResult(
    string ReportType,
    string MarkdownContent,
    Guid? ReportId);

public sealed record CompareDocumentsAiRequest(
    Guid WorkspaceId,
    Guid? FolderId,
    Guid? CreatedById,
    Guid AiJobId,
    IReadOnlyList<Guid> DocumentIds,
    IReadOnlyList<string> DocumentNames,
    string? Title,
    bool StoreReport);

public sealed record CompareDocumentsResult(
    string Objectives,
    string Scope,
    IReadOnlyList<string> Similarities,
    IReadOnlyList<string> Differences,
    IReadOnlyList<string> MissingInformation,
    IReadOnlyList<string> PotentialConflicts,
    IReadOnlyList<string> Recommendations,
    string RawMarkdown,
    Guid? ReportId);
