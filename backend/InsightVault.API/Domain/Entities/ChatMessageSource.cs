namespace InsightVault.API.Domain.Entities;

public sealed class ChatMessageSource
{
    public Guid Id { get; set; }
    public Guid ChatMessageId { get; set; }
    public Guid? DocumentId { get; set; }
    public Guid? DocumentChunkId { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string? Snippet { get; set; }
    public double? SimilarityScore { get; set; }
    public string Metadata { get; set; } = "{}";
    public int SourceOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ChatMessage ChatMessage { get; set; } = null!;
    public Document? Document { get; set; }
    public DocumentChunk? DocumentChunk { get; set; }
}
