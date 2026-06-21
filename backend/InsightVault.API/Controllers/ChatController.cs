using InsightVault.API.Application.Abstractions.Services.Chat;
using InsightVault.API.DTOs.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightVault.API.Controllers;

[ApiController]
[Authorize]
public sealed class ChatController(IChatService chatService) : ControllerBase
{
    [HttpGet("api/workspaces/{workspaceId:guid}/chat-sessions")]
    public async Task<ActionResult<IReadOnlyList<ChatSessionDto>>> ListSessions(
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        var sessions = await chatService.ListSessionsAsync(workspaceId, cancellationToken);

        return Ok(sessions);
    }

    [HttpPost("api/workspaces/{workspaceId:guid}/chat-sessions")]
    public async Task<ActionResult<ChatSessionDto>> CreateSession(
        Guid workspaceId,
        CreateChatSessionRequest request,
        CancellationToken cancellationToken)
    {
        var session = await chatService.CreateSessionAsync(
            workspaceId,
            request,
            cancellationToken);

        return Ok(session);
    }

    [HttpGet("api/chat-sessions/{sessionId:guid}/messages")]
    public async Task<ActionResult<IReadOnlyList<ChatMessageDto>>> ListMessages(
        Guid sessionId,
        CancellationToken cancellationToken)
    {
        var messages = await chatService.ListMessagesAsync(sessionId, cancellationToken);

        return Ok(messages);
    }

    [HttpPost("api/chat-sessions/{sessionId:guid}/messages")]
    public async Task<ActionResult<ChatTurnResponse>> SendMessage(
        Guid sessionId,
        SendChatMessageRequest request,
        CancellationToken cancellationToken)
    {
        var response = await chatService.SendMessageAsync(
            sessionId,
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpPatch("api/chat-sessions/{sessionId:guid}")]
    public async Task<ActionResult<ChatSessionDto>> UpdateSession(
        Guid sessionId,
        UpdateChatSessionRequest request,
        CancellationToken cancellationToken)
    {
        var session = await chatService.UpdateSessionAsync(sessionId, request, cancellationToken);
        return Ok(session);
    }

    [HttpDelete("api/chat-sessions/{sessionId:guid}")]
    public async Task<IActionResult> DeleteSession(
        Guid sessionId,
        CancellationToken cancellationToken)
    {
        await chatService.DeleteSessionAsync(sessionId, cancellationToken);

        return NoContent();
    }
}
