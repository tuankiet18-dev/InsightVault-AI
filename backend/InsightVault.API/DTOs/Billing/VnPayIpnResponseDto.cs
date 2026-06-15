using System.Text.Json.Serialization;

namespace InsightVault.API.DTOs.Billing;

public sealed record VnPayIpnResponseDto(
    [property: JsonPropertyName("RspCode")] string RspCode,
    [property: JsonPropertyName("Message")] string Message);
