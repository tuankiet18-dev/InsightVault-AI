using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Chat;

public sealed record SendChatMessageRequest(
    string Content,
    WebSearchOptionsDto? WebSearchOptions = null);
