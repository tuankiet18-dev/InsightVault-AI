using System.Security.Claims;
using InsightVault.API.Application.Abstractions.Auth;
using InsightVault.API.Common.Errors;

namespace InsightVault.API.Infrastructure.Auth;

public sealed class CurrentUserService(
    IHttpContextAccessor httpContextAccessor,
    IWebHostEnvironment environment) : ICurrentUserService
{
    public Guid GetRequiredUserId()
    {
        var userIdValue = GetClaimValue(ClaimTypes.NameIdentifier)
            ?? GetClaimValue("sub")
            ?? GetDevelopmentHeaderValue();

        if (Guid.TryParse(userIdValue, out var userId))
        {
            return userId;
        }

        throw new ApiException(
            StatusCodes.Status401Unauthorized,
            "auth.unauthorized",
            "A valid authenticated user is required.");
    }

    private string? GetClaimValue(string claimType)
    {
        return httpContextAccessor.HttpContext?.User.FindFirstValue(claimType);
    }

    private string? GetDevelopmentHeaderValue()
    {
        if (!environment.IsDevelopment())
        {
            return null;
        }

        return httpContextAccessor.HttpContext?.Request.Headers["X-User-Id"].FirstOrDefault();
    }
}
