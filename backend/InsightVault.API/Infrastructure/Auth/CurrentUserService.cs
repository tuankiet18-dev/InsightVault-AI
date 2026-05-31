using System.Security.Claims;
<<<<<<< HEAD
using InsightVault.API.Application.Abstractions.Services.Auth;

namespace InsightVault.API.Infrastructure.Auth;

public sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    public Guid? UserId
    {
        get
        {
            var value = httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier);
            return Guid.TryParse(value, out var userId) ? userId : null;
        }
    }

    public string? Email => httpContextAccessor.HttpContext?.User.FindFirstValue(ClaimTypes.Email);

    public bool IsAuthenticated =>
        httpContextAccessor.HttpContext?.User.Identity?.IsAuthenticated == true;
=======
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
>>>>>>> f07e3099f33f1c4031dd5f119fd1f7345fb5b495
}
