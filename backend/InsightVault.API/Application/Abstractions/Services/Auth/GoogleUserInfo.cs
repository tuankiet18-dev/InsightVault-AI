namespace InsightVault.API.Application.Abstractions.Services.Auth;

public sealed record GoogleUserInfo(
    string GoogleId,
    string Email,
    string FullName,
    string? AvatarUrl);
