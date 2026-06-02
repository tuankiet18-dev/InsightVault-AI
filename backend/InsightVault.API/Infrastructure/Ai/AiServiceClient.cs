using System.Net.Http.Json;
using System.Text.Json.Serialization;
using InsightVault.API.Application.Abstractions.Ai;
using InsightVault.API.Domain.Entities;

namespace InsightVault.API.Infrastructure.Ai;

public sealed class AiServiceClient(HttpClient httpClient) : IAiServiceClient
{
    public async Task<ProcessDocumentResult> ProcessDocumentAsync(
        Document document,
        CancellationToken cancellationToken = default)
    {
        var request = new ProcessDocumentRequest(
            document.Id,
            document.WorkspaceId,
            document.FolderId,
            document.MinioBucket,
            document.MinioObjectKey,
            document.FileType,
            document.OriginalFileName);

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
            result.Summary,
            result.KeyPoints,
            result.Keywords,
            result.Error);
    }

    private sealed record ProcessDocumentRequest(
        [property: JsonPropertyName("document_id")] Guid DocumentId,
        [property: JsonPropertyName("workspace_id")] Guid WorkspaceId,
        [property: JsonPropertyName("folder_id")] Guid? FolderId,
        [property: JsonPropertyName("minio_bucket")] string MinioBucket,
        [property: JsonPropertyName("minio_object_key")] string MinioObjectKey,
        [property: JsonPropertyName("file_type")] string FileType,
        [property: JsonPropertyName("file_name")] string FileName);

    private sealed record ProcessDocumentResponse(
        [property: JsonPropertyName("status")] string Status,
        [property: JsonPropertyName("document_id")] Guid DocumentId,
        [property: JsonPropertyName("chunk_count")] int ChunkCount,
        [property: JsonPropertyName("summary")] string Summary,
        [property: JsonPropertyName("key_points")] IReadOnlyList<string> KeyPoints,
        [property: JsonPropertyName("keywords")] IReadOnlyList<string> Keywords,
        [property: JsonPropertyName("error")] string? Error);
}
