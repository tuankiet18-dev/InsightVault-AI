namespace InsightVault.API.DTOs.Chat;

public sealed record WebSourceDto(
    string Title,
    string Url,
    string? Snippet,
    string? Provider);
