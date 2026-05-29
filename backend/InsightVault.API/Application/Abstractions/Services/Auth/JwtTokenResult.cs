namespace InsightVault.API.Application.Abstractions.Services.Auth;

public sealed record JwtTokenResult(
    string AccessToken,
    DateTimeOffset ExpiresAt);
