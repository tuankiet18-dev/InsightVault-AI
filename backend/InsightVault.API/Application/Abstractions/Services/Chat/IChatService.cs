using InsightVault.API.DTOs.Chat;

namespace InsightVault.API.Application.Abstractions.Services.Chat;

public interface IChatService
{
    Task<IReadOnlyList<ChatSessionDto>> ListSessionsAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<ChatSessionDto> CreateSessionAsync(
        Guid workspaceId,
        CreateChatSessionRequest request,
        CancellationToken cancellationToken = default);

    Task<ChatSessionDto> UpdateSessionAsync(
        Guid sessionId,
        UpdateChatSessionRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<ChatMessageDto>> ListMessagesAsync(
        Guid sessionId,
        CancellationToken cancellationToken = default);

    Task<ChatTurnResponse> SendMessageAsync(
        Guid sessionId,
        SendChatMessageRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteSessionAsync(
        Guid sessionId,
        CancellationToken cancellationToken = default);
}
