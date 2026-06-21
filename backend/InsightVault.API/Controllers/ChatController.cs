using InsightVault.API.Application.Abstractions.Services.Chat;
using InsightVault.API.DTOs.Chat;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;


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

    [HttpPost("api/chat-sessions/{sessionId:guid}/messages/stream")]
    public async Task StreamMessage(
        Guid sessionId,
        SendChatMessageRequest request,
        CancellationToken cancellationToken)
    {
        Response.ContentType = "text/event-stream";
        Response.Headers.CacheControl = "no-cache";
        Response.Headers.Connection = "keep-alive";

        var jsonOptions = new JsonSerializerOptions(JsonSerializerDefaults.Web);
        var streamEnumerable = chatService.StreamMessageAsync(sessionId, request, cancellationToken);

        await foreach (var streamEvent in streamEnumerable)
        {
            var data = JsonSerializer.Serialize(streamEvent, jsonOptions);
            await Response.WriteAsync($"data: {data}\n\n", cancellationToken);
            await Response.Body.FlushAsync(cancellationToken);
        }
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
