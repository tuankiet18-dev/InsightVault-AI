using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Invitations;

public sealed record WorkspaceInvitationDto(
    Guid Id,
    Guid WorkspaceId,
    string WorkspaceName,
    Guid InvitedUserId,
    string Email,
    ApiWorkspaceRole Role,
    ApiWorkspaceInvitationStatus Status,
    Guid? InvitedById,
    string? InvitedByName,
    DateTimeOffset ExpiresAt,
    DateTimeOffset? AcceptedAt,
    DateTimeOffset? DeclinedAt,
    DateTimeOffset? CancelledAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
