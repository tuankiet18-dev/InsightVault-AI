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

    Task<RagQueryResult> QueryRagAsync(
        RagQueryAiRequest request,
        CancellationToken cancellationToken = default);
}

public sealed record ProcessDocumentResult(
    string Status,
    Guid DocumentId,
    int ChunkCount,
    string DocumentType,
    double DocumentTypeConfidence,
    string AudienceFit,
    string Summary,
    IReadOnlyList<string> KeyPoints,
    ProcessDocumentInsights Insights,
    IReadOnlyList<string> Keywords,
    string? Error);

public sealed record ProcessDocumentInsights(
    IReadOnlyList<string> Scope,
    IReadOnlyList<string> Decisions,
    IReadOnlyList<string> Risks,
    IReadOnlyList<string> Gaps,
    IReadOnlyList<string> NextActions);

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

public sealed record RagQueryAiRequest(
    Guid WorkspaceId,
    string Question,
    string Scope,
    Guid? FolderId,
    IReadOnlyList<Guid>? DocumentIds,
    string? ReportContext,
    int TopK,
    IReadOnlyList<RagChatHistoryMessage> ChatHistory);

public sealed record RagChatHistoryMessage(
    string Role,
    string Content);

public sealed record RagQueryResult(
    string Answer,
    IReadOnlyList<RagSourceResult> Sources,
    IReadOnlyList<RagWebSourceResult> WebSources);

public sealed record RagSourceResult(
    Guid? ChunkId,
    Guid? DocumentId,
    string FileName,
    string Snippet,
    double? Similarity,
    int? ChunkIndex,
    int? PageNumber,
    object? RetrievalDebug);

public sealed record RagWebSourceResult(
    string Title,
    string Url,
    string? Snippet,
    string? Provider);
