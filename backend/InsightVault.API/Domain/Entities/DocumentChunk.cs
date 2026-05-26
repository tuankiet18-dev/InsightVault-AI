using Pgvector;

namespace InsightVault.API.Domain.Entities;

public sealed class DocumentChunk
{
    public Guid Id { get; set; }
    public Guid DocumentId { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid? FolderId { get; set; }
    public int ChunkIndex { get; set; }
    public string Content { get; set; } = string.Empty;
    public int? TokenCount { get; set; }
    public int? CharStart { get; set; }
    public int? CharEnd { get; set; }
    public Vector Embedding { get; set; } = null!;
    public string EmbeddingModel { get; set; } = string.Empty;
    public string Metadata { get; set; } = "{}";
    public DateTimeOffset CreatedAt { get; set; }

    public Document Document { get; set; } = null!;
    public Workspace Workspace { get; set; } = null!;
    public Folder? Folder { get; set; }
    public List<ChatMessageSource> ChatMessageSources { get; set; } = [];
}
