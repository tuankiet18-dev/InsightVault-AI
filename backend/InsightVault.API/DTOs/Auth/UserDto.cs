using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Auth;

public sealed record UserDto(
    Guid Id,
    string Email,
    string FullName,
    string? AvatarUrl,
    ApiSystemRole SystemRole,
    bool IsActive,
    DateTimeOffset? LastLoginAt);
