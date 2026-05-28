using InsightVault.API.DTOs.Auth;

namespace InsightVault.API.Application.Abstractions.Services.Auth;

public interface IAuthService
{
    Task<AuthResponse> LoginWithGoogleAsync(
        GoogleLoginRequest request,
        CancellationToken cancellationToken = default);

    Task<UserDto?> GetCurrentUserAsync(
        CancellationToken cancellationToken = default);
}
