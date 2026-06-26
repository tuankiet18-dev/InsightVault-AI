using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Workspaces;

public sealed record WorkspaceDto(
    Guid Id,
    Guid OwnerId,
    string Name,
    string? Description,
    bool IsArchived,
    ApiWorkspaceRole CurrentUserRole,
    string? BillingPlanCode,
    string? BillingPlanName,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
