using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Domain.Entities;

public sealed class WorkspaceMember
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid? UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public WorkspaceRole Role { get; set; } = WorkspaceRole.Viewer;
    public MemberStatus Status { get; set; } = MemberStatus.Invited;
    public Guid? InvitedById { get; set; }
    public DateTimeOffset InvitedAt { get; set; }
    public DateTimeOffset? JoinedAt { get; set; }
    public DateTimeOffset? RemovedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public User? User { get; set; }
    public User? InvitedBy { get; set; }
}
