namespace InsightVault.API.Domain.Entities;

public sealed class Workspace
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsArchived { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public User Owner { get; set; } = null!;
    public List<WorkspaceMember> Members { get; set; } = [];
    public List<Folder> Folders { get; set; } = [];
    public List<Document> Documents { get; set; } = [];
    public List<AiJob> AiJobs { get; set; } = [];
    public List<ChatSession> ChatSessions { get; set; } = [];
    public List<Report> Reports { get; set; } = [];
}
