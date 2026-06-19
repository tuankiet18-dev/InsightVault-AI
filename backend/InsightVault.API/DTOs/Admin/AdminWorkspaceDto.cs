namespace InsightVault.API.DTOs.Admin;

public sealed record AdminWorkspaceDto(
    Guid Id,
    string Name,
    string? Description,
    Guid OwnerId,
    string OwnerEmail,
    bool IsArchived,
    int MemberCount,
    int DocumentCount,
    long StorageBytes,
    int ReportCount,
    int AiJobCount,
    string? PlanName,
    int AiCreditsRemaining,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt,
    DateTimeOffset? DeletedAt);
