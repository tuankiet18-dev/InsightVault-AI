using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.DTOs.Auth;

namespace InsightVault.API.Application.Services.Auth;

public sealed class AuthService(
    IGoogleTokenVerifier googleTokenVerifier,
    IJwtTokenService jwtTokenService,
    ICurrentUserService currentUserService,
    IUserRepository userRepository,
    InsightVaultDbContext db) : IAuthService
{
    public async Task<AuthResponse> LoginWithGoogleAsync(
        GoogleLoginRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            throw new ArgumentException("Google id token is required.", nameof(request));
        }

        var googleUser = await googleTokenVerifier.VerifyAsync(request.IdToken, cancellationToken);
        var normalizedEmail = googleUser.Email.Trim().ToLowerInvariant();
        var now = DateTimeOffset.UtcNow;

        var user = await userRepository.GetByGoogleIdAsync(googleUser.GoogleId, cancellationToken)
            ?? await userRepository.GetByEmailAsync(normalizedEmail, cancellationToken);

        if (user is null)
        {
            user = new User
            {
                GoogleId = googleUser.GoogleId,
                Email = normalizedEmail,
                FullName = googleUser.FullName,
                AvatarUrl = googleUser.AvatarUrl,
                LastLoginAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };

            await userRepository.AddAsync(user, cancellationToken);
            await db.SaveChangesAsync(cancellationToken);
        }
        else
        {
            user.GoogleId = googleUser.GoogleId;
            user.Email = normalizedEmail;
            user.FullName = googleUser.FullName;
            user.AvatarUrl = googleUser.AvatarUrl;
            user.LastLoginAt = now;
            user.UpdatedAt = now;
            userRepository.Update(user);
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("User account is inactive.");
        }

        await userRepository.ActivateInvitedMembershipsAsync(user, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        var token = jwtTokenService.GenerateToken(user);

        return new AuthResponse(
            token.AccessToken,
            token.ExpiresAt,
            AuthMapper.ToDto(user));
    }

    public async Task<UserDto?> GetCurrentUserAsync(
        CancellationToken cancellationToken = default)
    {
        if (!currentUserService.IsAuthenticated || currentUserService.UserId is not { } userId)
        {
            return null;
        }

        var user = await userRepository.GetByIdAsync(userId, cancellationToken);
        if (user is null || !user.IsActive)
        {
            return null;
        }

        return AuthMapper.ToDto(user);
    }
}
