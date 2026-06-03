using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Domain.Entities;

public sealed class ChatMessageContext
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid ChatMessageId { get; set; }
    public ChatContextType ContextType { get; set; }
    public Guid? FolderId { get; set; }
    public Guid? DocumentId { get; set; }
    public bool IncludeSubfolders { get; set; } = true;
    public int ContextOrder { get; set; }
    public string? ContextDisplayName { get; set; }
    public string? ContextPath { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public ChatMessage ChatMessage { get; set; } = null!;
    public Folder? Folder { get; set; }
    public Document? Document { get; set; }
}
