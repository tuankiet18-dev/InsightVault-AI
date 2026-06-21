using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;
using System.Text.Json.Serialization;
using InsightVault.API.Application.Abstractions.Ai;
using InsightVault.API.Domain.Entities;

namespace InsightVault.API.Infrastructure.Ai;

public sealed class AiServiceClient(HttpClient httpClient) : IAiServiceClient
{
    public async Task<ProcessDocumentResult> ProcessDocumentAsync(
        Document document,
        string? modelName = null,
        CancellationToken cancellationToken = default)
    {
        var request = new ProcessDocumentRequest(
            document.Id,
            document.WorkspaceId,
            document.FolderId,
            document.MinioBucket,
            document.MinioObjectKey,
            document.FileType,
            document.OriginalFileName,
            modelName);

        var response = await httpClient.PostAsJsonAsync(
            "/process-document",
            request,
            cancellationToken);
        var result = await response.Content.ReadFromJsonAsync<ProcessDocumentResponse>(
            cancellationToken: cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = result?.Error ?? await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"AI service process-document failed: {error}");
        }

        if (result is null)
        {
            throw new InvalidOperationException("AI service returned an empty process-document response.");
        }

        return new ProcessDocumentResult(
            result.Status,
            result.DocumentId,
            result.ChunkCount,
            string.IsNullOrWhiteSpace(result.DocumentType) ? "general_document" : result.DocumentType,
            result.DocumentTypeConfidence,
            string.IsNullOrWhiteSpace(result.AudienceFit) ? "students_founders_pm_ba" : result.AudienceFit,
            result.Summary,
            result.KeyPoints,
            new ProcessDocumentInsights(
                result.Insights?.Scope ?? [],
                result.Insights?.Decisions ?? [],
                result.Insights?.Risks ?? [],
                result.Insights?.Gaps ?? [],
                result.Insights?.NextActions ?? []),
            result.Keywords,
            result.Error);
    }

    public async Task<GenerateReportResult> GenerateReportAsync(
        GenerateReportAiRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await httpClient.PostAsJsonAsync(
            "/generate-report",
            new GenerateReportRequest(
                request.WorkspaceId,
                request.FolderId,
                request.CreatedById,
                request.AiJobId,
                request.DocumentIds,
                request.ReportType,
                request.Title,
                request.CustomPrompt,
                request.StoreReport,
                request.ModelName),
            cancellationToken);
        var result = await response.Content.ReadFromJsonAsync<GenerateReportResponse>(
            cancellationToken: cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"AI service generate-report failed: {error}");
        }

        if (result is null)
        {
            throw new InvalidOperationException("AI service returned an empty generate-report response.");
        }

        return new GenerateReportResult(
            result.ReportType,
            result.MarkdownContent,
            result.ReportId);
    }

    public async Task<CompareDocumentsResult> CompareDocumentsAsync(
        CompareDocumentsAiRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await httpClient.PostAsJsonAsync(
            "/compare",
            new CompareDocumentsRequest(
                request.WorkspaceId,
                request.FolderId,
                request.CreatedById,
                request.AiJobId,
                request.DocumentIds,
                request.DocumentNames,
                request.Title,
                request.StoreReport,
                request.ModelName),
            cancellationToken);
        var result = await response.Content.ReadFromJsonAsync<CompareDocumentsResponse>(
            cancellationToken: cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"AI service compare failed: {error}");
        }

        if (result is null)
        {
            throw new InvalidOperationException("AI service returned an empty compare response.");
        }

        return new CompareDocumentsResult(
            result.Objectives,
            result.Scope,
            result.Similarities,
            result.Differences,
            result.MissingInformation,
            result.PotentialConflicts,
            result.Recommendations,
            result.RawMarkdown,
            result.ReportId);
    }

    public async Task<RagQueryResult> QueryRagAsync(
        RagQueryAiRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await httpClient.PostAsJsonAsync(
            "/rag/query",
            new RagQueryRequest(
                request.Question,
                request.WorkspaceId,
                request.Scope,
                request.FolderId,
                request.DocumentIds,
                request.ReportContext,
                request.TopK,
                request.ChatHistory.Select(message => new RagChatHistoryRequest(
                    message.Role,
                    message.Content)).ToList(),
                request.ModelName,
                new RagWebSearchOptionsRequest(
                    request.WebSearchEnabled,
                    request.WebSearchProvider,
                    MaxResults: 5)),
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"AI service rag query failed: {error}");
        }

        var result = await response.Content.ReadFromJsonAsync<RagQueryResponse>(
            cancellationToken: cancellationToken);

        if (result is null)
        {
            throw new InvalidOperationException("AI service returned an empty rag query response.");
        }

        return new RagQueryResult(
            result.Answer,
            result.Sources.Select(source => new RagSourceResult(
                source.ChunkId,
                source.DocumentId,
                source.FileName,
                source.Snippet,
                source.Similarity,
                source.ChunkIndex,
                source.PageNumber,
                source.RetrievalDebug)).ToList(),
            result.WebSources.Select(source => new RagWebSourceResult(
                source.Title,
                source.Url,
                source.Snippet,
                source.Provider)).ToList());
    }

    public async IAsyncEnumerable<RagStreamEvent> StreamRagAsync(
        RagQueryAiRequest request,
        [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, "/rag/stream");
        httpRequest.Content = JsonContent.Create(new RagQueryRequest(
            request.Question,
            request.WorkspaceId,
            request.Scope,
            request.FolderId,
            request.DocumentIds,
            request.ReportContext,
            request.TopK,
            request.ChatHistory.Select(message => new RagChatHistoryRequest(
                message.Role,
                message.Content)).ToList(),
            request.ModelName,
            new RagWebSearchOptionsRequest(
                request.WebSearchEnabled,
                request.WebSearchProvider,
                MaxResults: 5)));

        using var response = await httpClient.SendAsync(
            httpRequest,
            HttpCompletionOption.ResponseHeadersRead,
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"AI service rag stream failed: {error}");
        }

        using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        using var reader = new StreamReader(stream);
        var jsonOptions = new JsonSerializerOptions(JsonSerializerDefaults.Web);

        while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
        {
            var line = await reader.ReadLineAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(line))
            {
                continue;
            }

            if (line.StartsWith("data: "))
            {
                var data = line[6..];
                if (data == "[DONE]")
                {
                    break;
                }

                RagStreamEvent? streamEvent = null;
                try
                {
                    streamEvent = JsonSerializer.Deserialize<RagStreamEvent>(data, jsonOptions);
                }
                catch (JsonException)
                {
                    continue;
                }

                if (streamEvent is not null)
                {
                    yield return streamEvent;
                }
            }
        }
    }

    public async Task<GenerateTitleResult> GenerateChatTitleAsync(
        string question,
        string? modelName = null,
        CancellationToken cancellationToken = default)
    {
        var response = await httpClient.PostAsJsonAsync(
            "/rag/generate-title",
            new GenerateTitleRequest(question, modelName),
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new InvalidOperationException($"AI service generate-title failed: {error}");
        }

        var result = await response.Content.ReadFromJsonAsync<GenerateTitleResponse>(
            cancellationToken: cancellationToken);

        if (result is null)
        {
            throw new InvalidOperationException("AI service returned an empty generate-title response.");
        }

        return new GenerateTitleResult(result.Title);
    }

    private sealed record ProcessDocumentRequest(
        [property: JsonPropertyName("document_id")] Guid DocumentId,
        [property: JsonPropertyName("workspace_id")] Guid WorkspaceId,
        [property: JsonPropertyName("folder_id")] Guid? FolderId,
        [property: JsonPropertyName("minio_bucket")] string MinioBucket,
        [property: JsonPropertyName("minio_object_key")] string MinioObjectKey,
        [property: JsonPropertyName("file_type")] string FileType,
        [property: JsonPropertyName("file_name")] string FileName,
        [property: JsonPropertyName("model_name")] string? ModelName);

    private sealed record ProcessDocumentResponse(
        [property: JsonPropertyName("status")] string Status,
        [property: JsonPropertyName("document_id")] Guid DocumentId,
        [property: JsonPropertyName("chunk_count")] int ChunkCount,
        [property: JsonPropertyName("document_type")] string DocumentType,
        [property: JsonPropertyName("document_type_confidence")] double DocumentTypeConfidence,
        [property: JsonPropertyName("audience_fit")] string AudienceFit,
        [property: JsonPropertyName("summary")] string Summary,
        [property: JsonPropertyName("key_points")] IReadOnlyList<string> KeyPoints,
        [property: JsonPropertyName("insights")] ProcessDocumentInsightsResponse? Insights,
        [property: JsonPropertyName("keywords")] IReadOnlyList<string> Keywords,
        [property: JsonPropertyName("error")] string? Error);

    private sealed record ProcessDocumentInsightsResponse(
        [property: JsonPropertyName("scope")] IReadOnlyList<string> Scope,
        [property: JsonPropertyName("decisions")] IReadOnlyList<string> Decisions,
        [property: JsonPropertyName("risks")] IReadOnlyList<string> Risks,
        [property: JsonPropertyName("gaps")] IReadOnlyList<string> Gaps,
        [property: JsonPropertyName("next_actions")] IReadOnlyList<string> NextActions);

    private sealed record GenerateReportRequest(
        [property: JsonPropertyName("workspace_id")] Guid WorkspaceId,
        [property: JsonPropertyName("folder_id")] Guid? FolderId,
        [property: JsonPropertyName("created_by_id")] Guid? CreatedById,
        [property: JsonPropertyName("ai_job_id")] Guid AiJobId,
        [property: JsonPropertyName("document_ids")] IReadOnlyList<Guid> DocumentIds,
        [property: JsonPropertyName("report_type")] string ReportType,
        [property: JsonPropertyName("title")] string? Title,
        [property: JsonPropertyName("custom_prompt")] string? CustomPrompt,
        [property: JsonPropertyName("store_report")] bool StoreReport,
        [property: JsonPropertyName("model_name")] string? ModelName);

    private sealed record GenerateReportResponse(
        [property: JsonPropertyName("report_type")] string ReportType,
        [property: JsonPropertyName("markdown_content")] string MarkdownContent,
        [property: JsonPropertyName("report_id")] Guid? ReportId);

    private sealed record CompareDocumentsRequest(
        [property: JsonPropertyName("workspace_id")] Guid WorkspaceId,
        [property: JsonPropertyName("folder_id")] Guid? FolderId,
        [property: JsonPropertyName("created_by_id")] Guid? CreatedById,
        [property: JsonPropertyName("ai_job_id")] Guid AiJobId,
        [property: JsonPropertyName("document_ids")] IReadOnlyList<Guid> DocumentIds,
        [property: JsonPropertyName("document_names")] IReadOnlyList<string> DocumentNames,
        [property: JsonPropertyName("title")] string? Title,
        [property: JsonPropertyName("store_report")] bool StoreReport,
        [property: JsonPropertyName("model_name")] string? ModelName);

    private sealed record CompareDocumentsResponse(
        [property: JsonPropertyName("objectives")] string Objectives,
        [property: JsonPropertyName("scope")] string Scope,
        [property: JsonPropertyName("similarities")] IReadOnlyList<string> Similarities,
        [property: JsonPropertyName("differences")] IReadOnlyList<string> Differences,
        [property: JsonPropertyName("missing_information")] IReadOnlyList<string> MissingInformation,
        [property: JsonPropertyName("potential_conflicts")] IReadOnlyList<string> PotentialConflicts,
        [property: JsonPropertyName("recommendations")] IReadOnlyList<string> Recommendations,
        [property: JsonPropertyName("raw_markdown")] string RawMarkdown,
        [property: JsonPropertyName("report_id")] Guid? ReportId);

    private sealed record RagQueryRequest(
        [property: JsonPropertyName("question")] string Question,
        [property: JsonPropertyName("workspace_id")] Guid WorkspaceId,
        [property: JsonPropertyName("scope")] string Scope,
        [property: JsonPropertyName("folder_id")] Guid? FolderId,
        [property: JsonPropertyName("document_ids")] IReadOnlyList<Guid>? DocumentIds,
        [property: JsonPropertyName("report_context")] string? ReportContext,
        [property: JsonPropertyName("top_k")] int TopK,
        [property: JsonPropertyName("chat_history")] IReadOnlyList<RagChatHistoryRequest> ChatHistory,
        [property: JsonPropertyName("model_name")] string? ModelName,
        [property: JsonPropertyName("web_search_options")] RagWebSearchOptionsRequest WebSearchOptions);

    private sealed record RagChatHistoryRequest(
        [property: JsonPropertyName("role")] string Role,
        [property: JsonPropertyName("content")] string Content);

    private sealed record RagWebSearchOptionsRequest(
        [property: JsonPropertyName("enabled")] bool Enabled,
        [property: JsonPropertyName("provider")] string? Provider,
        [property: JsonPropertyName("max_results")] int MaxResults);

    private sealed record RagQueryResponse(
        [property: JsonPropertyName("answer")] string Answer,
        [property: JsonPropertyName("sources")] IReadOnlyList<RagSourceResponse> Sources,
        [property: JsonPropertyName("web_sources")] IReadOnlyList<RagWebSourceResponse> WebSources);

    private sealed record RagSourceResponse(
        [property: JsonPropertyName("chunk_id")] Guid? ChunkId,
        [property: JsonPropertyName("document_id")] Guid? DocumentId,
        [property: JsonPropertyName("file_name")] string FileName,
        [property: JsonPropertyName("snippet")] string Snippet,
        [property: JsonPropertyName("similarity")] double? Similarity,
        [property: JsonPropertyName("chunk_index")] int? ChunkIndex,
        [property: JsonPropertyName("page_number")] int? PageNumber,
        [property: JsonPropertyName("retrieval_debug")] object? RetrievalDebug);

    private sealed record RagWebSourceResponse(
        [property: JsonPropertyName("title")] string Title,
        [property: JsonPropertyName("url")] string Url,
        [property: JsonPropertyName("snippet")] string? Snippet,
        [property: JsonPropertyName("provider")] string? Provider);

    private sealed record GenerateTitleRequest(
        [property: JsonPropertyName("question")] string Question,
        [property: JsonPropertyName("model_name")] string? ModelName);

    private sealed record GenerateTitleResponse(
        [property: JsonPropertyName("title")] string Title);
}
