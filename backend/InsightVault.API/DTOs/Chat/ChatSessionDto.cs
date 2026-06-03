using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Chat;

public sealed record ChatSessionDto(
    Guid Id,
    Guid WorkspaceId,
    string? Title,
    bool? WebSearchEnabled,
    ApiWebSearchProvider? WebSearchProvider,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
