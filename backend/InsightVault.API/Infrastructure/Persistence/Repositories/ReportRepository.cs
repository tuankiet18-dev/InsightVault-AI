using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Infrastructure.Persistence.Repositories;

// Specific repository: reports need workspace/folder/type filters and soft-delete rules.
public sealed class ReportRepository(InsightVaultDbContext db)
    : GenericRepository<Report>(db), IReportRepository
{
    public async Task<Report?> GetByIdInWorkspaceAsync(
        Guid reportId,
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        return await Db.Reports.FirstOrDefaultAsync(
            report => report.Id == reportId
                && report.WorkspaceId == workspaceId
                && report.DeletedAt == null,
            cancellationToken);
    }

    public async Task<IReadOnlyList<Report>> ListByWorkspaceAsync(
        Guid workspaceId,
        Guid? folderId = null,
        ReportType? reportType = null,
        CancellationToken cancellationToken = default)
    {
        var query = Db.Reports
            .AsNoTracking()
            .Where(report => report.WorkspaceId == workspaceId && report.DeletedAt == null);

        if (folderId.HasValue)
        {
            query = query.Where(report => report.FolderId == folderId.Value);
        }

        if (reportType.HasValue)
        {
            query = query.Where(report => report.ReportType == reportType.Value);
        }

        return await query
            .OrderByDescending(report => report.CreatedAt)
            .ToListAsync(cancellationToken);
    }
}
