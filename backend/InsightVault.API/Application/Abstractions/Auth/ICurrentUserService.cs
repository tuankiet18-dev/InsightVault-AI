namespace InsightVault.API.Application.Abstractions.Auth;

public interface ICurrentUserService
{
    Guid GetRequiredUserId();
}
