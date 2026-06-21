using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Workspaces;

public sealed record WorkspaceMemberDto(
    Guid Id,
    Guid WorkspaceId,
    Guid? UserId,
    string Email,
    string? FullName,
    string? AvatarUrl,
    ApiWorkspaceRole Role,
    ApiMemberStatus Status,
    Guid? InvitedById,
    DateTimeOffset InvitedAt,
    DateTimeOffset? JoinedAt);
