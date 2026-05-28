using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Chat;

public sealed record ChatMessageDto(
    Guid Id,
    Guid ChatSessionId,
    ApiChatMessageRole Role,
    string Content,
    string? ModelName,
    IReadOnlyList<ChatSourceDto> Sources,
    IReadOnlyList<WebSourceDto>? WebSources,
    DateTimeOffset CreatedAt);
