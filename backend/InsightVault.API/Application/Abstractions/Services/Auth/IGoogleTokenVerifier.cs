namespace InsightVault.API.Application.Abstractions.Services.Auth;

public interface IGoogleTokenVerifier
{
    Task<GoogleUserInfo> VerifyAsync(
        string idToken,
        CancellationToken cancellationToken = default);
}
