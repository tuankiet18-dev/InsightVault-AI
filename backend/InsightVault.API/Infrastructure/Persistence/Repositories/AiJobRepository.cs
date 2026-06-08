using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Infrastructure.Persistence.Repositories;

// Specific repository: AI jobs need queue/status and recent monitoring queries.
public sealed class AiJobRepository(InsightVaultDbContext db)
    : GenericRepository<AiJob>(db), IAiJobRepository
{
    public async Task<AiJob?> GetByIdInWorkspaceAsync(
        Guid jobId,
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        return await Db.AiJobs.FirstOrDefaultAsync(
            job => job.Id == jobId && job.WorkspaceId == workspaceId,
            cancellationToken);
    }

    public async Task<IReadOnlyList<AiJob>> ListRecentByWorkspaceAsync(
        Guid workspaceId,
        AiJobStatus? status = null,
        AiJobType? jobType = null,
        int limit = 20,
        CancellationToken cancellationToken = default)
    {
        var query = Db.AiJobs
            .AsNoTracking()
            .Where(job => job.WorkspaceId == workspaceId);

        if (status.HasValue)
        {
            query = query.Where(job => job.Status == status.Value);
        }

        if (jobType.HasValue)
        {
            query = query.Where(job => job.JobType == jobType.Value);
        }

        return await query
            .OrderByDescending(job => job.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<AiJob>> ListByStatusAsync(
        AiJobStatus status,
        int limit = 20,
        CancellationToken cancellationToken = default)
    {
        return await Db.AiJobs
            .AsNoTracking()
            .Where(job => job.Status == status)
            .OrderBy(job => job.CreatedAt)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }
}
