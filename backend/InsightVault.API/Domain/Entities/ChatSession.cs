using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Domain.Entities;

public sealed class ChatSession
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid? CreatedById { get; set; }
    public string? Title { get; set; }
    public ChatScopeType ScopeType { get; set; } = ChatScopeType.Workspace;
    public Guid? ScopeWorkspaceId { get; set; }
    public Guid? ScopeFolderId { get; set; }
    public Guid? ScopeDocumentId { get; set; }
    public bool IncludeSubfolders { get; set; } = true;
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public User? CreatedBy { get; set; }
    public Workspace? ScopeWorkspace { get; set; }
    public Folder? ScopeFolder { get; set; }
    public Document? ScopeDocument { get; set; }
    public List<ChatMessage> Messages { get; set; } = [];
}
