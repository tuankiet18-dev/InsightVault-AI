using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Domain.Entities;

public sealed class User
{
    public Guid Id { get; set; }
    public string GoogleId { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public SystemRole SystemRole { get; set; } = SystemRole.User;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? LastLoginAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public List<Workspace> OwnedWorkspaces { get; set; } = [];
    public List<WorkspaceMember> WorkspaceMemberships { get; set; } = [];
    public List<Folder> CreatedFolders { get; set; } = [];
    public List<Document> UploadedDocuments { get; set; } = [];
    public List<AiJob> AiJobs { get; set; } = [];
    public List<ChatSession> ChatSessions { get; set; } = [];
    public List<Report> Reports { get; set; } = [];
    public UserSubscription? Subscription { get; set; }
    public List<PaymentOrder> PaymentOrders { get; set; } = [];
    public List<CreditLedgerEntry> CreditLedgerEntries { get; set; } = [];
}
