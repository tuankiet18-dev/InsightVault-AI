namespace InsightVault.API.Domain.Entities;

public sealed class Folder
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid? ParentFolderId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? CreatedById { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public Folder? ParentFolder { get; set; }
    public User? CreatedBy { get; set; }
    public List<Folder> ChildFolders { get; set; } = [];
    public List<Document> Documents { get; set; } = [];
    public List<ChatMessageContext> ChatMessageContexts { get; set; } = [];
    public List<Report> Reports { get; set; } = [];
}
