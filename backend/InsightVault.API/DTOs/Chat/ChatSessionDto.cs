using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Chat;

public sealed record ChatSessionDto(
    Guid Id,
    Guid WorkspaceId,
    string? Title,
    ApiChatScopeType ScopeType,
    Guid? ScopeWorkspaceId,
    Guid? ScopeFolderId,
    IReadOnlyList<Guid>? ScopeDocumentIds,
    bool IncludeSubfolders,
    bool? WebSearchEnabled,
    ApiWebSearchProvider? WebSearchProvider,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
