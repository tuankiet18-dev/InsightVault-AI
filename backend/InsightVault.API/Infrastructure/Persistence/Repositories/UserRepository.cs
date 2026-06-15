using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Infrastructure.Persistence.Repositories;

public sealed class UserRepository(InsightVaultDbContext db)
    : GenericRepository<User>(db), IUserRepository
{
    public async Task<User?> GetByGoogleIdAsync(
        string googleId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Users.FirstOrDefaultAsync(
            user => user.GoogleId == googleId,
            cancellationToken);
    }

    public async Task<User?> GetByEmailAsync(
        string email,
        CancellationToken cancellationToken = default)
    {
        return await Db.Users.FirstOrDefaultAsync(
            user => user.Email == email,
            cancellationToken);
    }

}
