using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Domain.Entities;

public sealed class ChatMessage
{
    public Guid Id { get; set; }
    public Guid ChatSessionId { get; set; }
    public ChatMessageRole Role { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? ModelName { get; set; }
    public int? PromptTokens { get; set; }
    public int? CompletionTokens { get; set; }
    public int? LatencyMs { get; set; }
    public string Metadata { get; set; } = "{}";
    public DateTimeOffset CreatedAt { get; set; }

    public ChatSession ChatSession { get; set; } = null!;
    public List<ChatMessageSource> Sources { get; set; } = [];
}
