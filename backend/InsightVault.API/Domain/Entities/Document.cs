using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Domain.Entities;

public sealed class Document
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid? FolderId { get; set; }
    public Guid? UploadedById { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string FileType { get; set; } = string.Empty;
    public string? MimeType { get; set; }
    public long FileSizeBytes { get; set; }
    public string MinioBucket { get; set; } = string.Empty;
    public string MinioObjectKey { get; set; } = string.Empty;
    public DocumentStatus Status { get; set; } = DocumentStatus.Uploaded;
    public string? Summary { get; set; }
    public string KeyPoints { get; set; } = "[]";
    public string Keywords { get; set; } = "[]";
    public string? ExtractedTextHash { get; set; }
    public string? ProcessingError { get; set; }
    public DateTimeOffset? ProcessedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public Folder? Folder { get; set; }
    public User? UploadedBy { get; set; }
    public List<DocumentChunk> Chunks { get; set; } = [];
    public List<AiJob> AiJobs { get; set; } = [];
    public List<ChatMessageContext> ChatMessageContexts { get; set; } = [];
    public List<ChatMessageSource> ChatMessageSources { get; set; } = [];
}
