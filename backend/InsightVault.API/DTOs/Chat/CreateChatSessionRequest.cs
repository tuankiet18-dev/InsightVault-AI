using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Chat;

public sealed record CreateChatSessionRequest(
    string? Title,
    bool? WebSearchEnabled,
    ApiWebSearchProvider? WebSearchProvider);
