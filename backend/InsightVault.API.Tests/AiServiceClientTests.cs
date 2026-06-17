using System.Net;
using System.Text;
using System.Text.Json;
using InsightVault.API.Application.Abstractions.Ai;
using InsightVault.API.Infrastructure.Ai;

namespace InsightVault.API.Tests;

public sealed class AiServiceClientTests
{
    [Fact]
    public async Task QueryRagAsync_posts_contract_payload_and_maps_response()
    {
        var workspaceId = Guid.NewGuid();
        var documentId = Guid.NewGuid();
        var chunkId = Guid.NewGuid();
        using var handler = new CapturingHandler(new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(
                $$"""
                {
                  "answer": "Answer markdown",
                  "sources": [
                    {
                      "chunk_id": "{{chunkId}}",
                      "document_id": "{{documentId}}",
                      "file_name": "Requirement.pdf",
                      "snippet": "Relevant snippet",
                      "similarity": 0.82,
                      "chunk_index": 4,
                      "page_number": 2,
                      "retrieval_debug": { "dense_rank": 1 }
                    }
                  ],
                  "web_sources": []
                }
                """,
                Encoding.UTF8,
                "application/json")
        });
        using var httpClient = new HttpClient(handler)
        {
            BaseAddress = new Uri("http://ai-service")
        };
        var client = new AiServiceClient(httpClient);

        var result = await client.QueryRagAsync(new RagQueryAiRequest(
            workspaceId,
            "Explain MVP",
            "document",
            FolderId: null,
            [documentId],
            ReportContext: null,
            TopK: 5,
            [new RagChatHistoryMessage("user", "Previous question")]));

        Assert.Equal("/rag/query", handler.RequestUri?.AbsolutePath);
        Assert.Equal("Answer markdown", result.Answer);
        Assert.Single(result.Sources);
        Assert.Equal(documentId, result.Sources[0].DocumentId);
        Assert.Equal(chunkId, result.Sources[0].ChunkId);
        Assert.Equal("Requirement.pdf", result.Sources[0].FileName);

        using var payload = JsonDocument.Parse(handler.RequestBody ?? "{}");
        var root = payload.RootElement;
        Assert.Equal("Explain MVP", root.GetProperty("question").GetString());
        Assert.Equal(workspaceId, root.GetProperty("workspace_id").GetGuid());
        Assert.Equal("document", root.GetProperty("scope").GetString());
        Assert.Equal(documentId, root.GetProperty("document_ids")[0].GetGuid());
        Assert.True(root.TryGetProperty("report_context", out var reportContext));
        Assert.Equal(JsonValueKind.Null, reportContext.ValueKind);
        Assert.Equal(5, root.GetProperty("top_k").GetInt32());
        Assert.Equal("user", root.GetProperty("chat_history")[0].GetProperty("role").GetString());
        Assert.False(root.GetProperty("web_search_options").GetProperty("enabled").GetBoolean());
    }

    private sealed class CapturingHandler(HttpResponseMessage response) : HttpMessageHandler, IDisposable
    {
        public Uri? RequestUri { get; private set; }
        public string? RequestBody { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestUri = request.RequestUri;
            RequestBody = request.Content is null
                ? null
                : await request.Content.ReadAsStringAsync(cancellationToken);

            return response;
        }

        public new void Dispose()
        {
            response.Dispose();
            base.Dispose();
        }
    }
}
