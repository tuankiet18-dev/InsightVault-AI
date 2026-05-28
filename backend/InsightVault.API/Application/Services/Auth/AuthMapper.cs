using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.DTOs.Auth;
using InsightVault.API.DTOs.Common;

namespace InsightVault.API.Application.Services.Auth;

internal static class AuthMapper
{
    public static UserDto ToDto(User user)
    {
        return new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.AvatarUrl,
            ToApiSystemRole(user.SystemRole),
            user.IsActive,
            user.LastLoginAt);
    }

    private static ApiSystemRole ToApiSystemRole(SystemRole role)
    {
        return role switch
        {
            SystemRole.Admin => ApiSystemRole.Admin,
            _ => ApiSystemRole.User
        };
    }
}
