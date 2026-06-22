using System.Text.Json;

namespace InsightVault.API.DTOs.Chat;

public sealed record ChatStreamEventDto(
    string Event,
    JsonElement Data);
