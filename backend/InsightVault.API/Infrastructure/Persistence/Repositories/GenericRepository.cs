using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Data;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Infrastructure.Persistence.Repositories;

public class GenericRepository<TEntity>(InsightVaultDbContext db) : IRepository<TEntity>
    where TEntity : class
{
    protected InsightVaultDbContext Db { get; } = db;
    protected DbSet<TEntity> Set => Db.Set<TEntity>();

    public virtual async Task<IReadOnlyList<TEntity>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        return await Set.AsNoTracking().ToListAsync(cancellationToken);
    }

    public virtual async Task<TEntity?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await Set.FindAsync([id], cancellationToken);
    }

    public virtual async Task AddAsync(TEntity entity, CancellationToken cancellationToken = default)
    {
        await Set.AddAsync(entity, cancellationToken);
    }

    public virtual async Task AddRangeAsync(IEnumerable<TEntity> entities, CancellationToken cancellationToken = default)
    {
        await Set.AddRangeAsync(entities, cancellationToken);
    }

    public virtual void Update(TEntity entity)
    {
        Set.Update(entity);
    }

    public virtual void Delete(TEntity entity)
    {
        Set.Remove(entity);
    }

    public virtual void DeleteRange(IEnumerable<TEntity> entities)
    {
        Set.RemoveRange(entities);
    }
}
