namespace InsightVault.API.DTOs.Chat;

public sealed record ChatTurnResponse(
    ChatMessageDto UserMessage,
    ChatMessageDto AssistantMessage);
