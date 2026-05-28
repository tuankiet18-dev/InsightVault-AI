using InsightVault.API.Domain.Entities;

namespace InsightVault.API.Application.Abstractions.Repositories;

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByGoogleIdAsync(
        string googleId,
        CancellationToken cancellationToken = default);

    Task<User?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken = default);

    Task ActivateInvitedMembershipsAsync(
        User user,
        CancellationToken cancellationToken = default);
}
