using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Domain.Entities;

public sealed class WorkspaceInvitation
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid InvitedUserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public WorkspaceRole Role { get; set; } = WorkspaceRole.Viewer;
    public WorkspaceInvitationStatus Status { get; set; } = WorkspaceInvitationStatus.Pending;
    public string? TokenHash { get; set; }
    public DateTimeOffset ExpiresAt { get; set; }
    public Guid? InvitedById { get; set; }
    public DateTimeOffset? AcceptedAt { get; set; }
    public DateTimeOffset? DeclinedAt { get; set; }
    public DateTimeOffset? CancelledAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public User InvitedUser { get; set; } = null!;
    public User? InvitedBy { get; set; }
}
