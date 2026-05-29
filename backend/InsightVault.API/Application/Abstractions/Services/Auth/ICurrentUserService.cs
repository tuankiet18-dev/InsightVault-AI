namespace InsightVault.API.Application.Abstractions.Services.Auth;

public interface ICurrentUserService
{
    Guid? UserId { get; }
    string? Email { get; }
    bool IsAuthenticated { get; }
}
