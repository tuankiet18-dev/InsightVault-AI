namespace InsightVault.API.DTOs.Chat;

public sealed record UpdateChatSessionRequest(
    string? Title,
    bool? IsPinned);
