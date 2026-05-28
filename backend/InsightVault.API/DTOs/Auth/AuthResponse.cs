namespace InsightVault.API.DTOs.Auth;

public sealed record AuthResponse(
    string AccessToken,
    DateTimeOffset ExpiresAt,
    UserDto User);
