using Google.Apis.Auth;
using InsightVault.API.Application.Abstractions.Services.Auth;
using Microsoft.Extensions.Options;

namespace InsightVault.API.Infrastructure.Auth;

public sealed class GoogleTokenVerifier(IOptions<GoogleAuthOptions> options) : IGoogleTokenVerifier
{
    public async Task<GoogleUserInfo> VerifyAsync(
        string idToken,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(options.Value.ClientId))
        {
            throw new InvalidOperationException("Google client id is not configured.");
        }

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(
                idToken,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [options.Value.ClientId]
                });

            if (!payload.EmailVerified)
            {
                throw new InvalidOperationException("Google email is not verified.");
            }

            return new GoogleUserInfo(
                payload.Subject,
                payload.Email,
                payload.Name ?? payload.Email,
                payload.Picture);
        }
        catch (InvalidJwtException ex)
        {
            throw new InvalidOperationException("Invalid Google id token.", ex);
        }
    }
}
