namespace InsightVault.API.Domain.Entities;

public sealed class ChatSession
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid? CreatedById { get; set; }
    public string? Title { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public User? CreatedBy { get; set; }
    public List<ChatMessage> Messages { get; set; } = [];
}
