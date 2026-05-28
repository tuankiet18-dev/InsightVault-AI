using InsightVault.API.Domain.Entities;

namespace InsightVault.API.Application.Abstractions.Services.Auth;

public interface IJwtTokenService
{
    JwtTokenResult GenerateToken(User user);
}
