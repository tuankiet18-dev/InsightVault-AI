using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Application.Abstractions.Repositories;

public interface IReportRepository : IRepository<Report>
{
    Task<Report?> GetByIdInWorkspaceAsync(
        Guid reportId,
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<Report>> ListByWorkspaceAsync(
        Guid workspaceId,
        Guid? folderId = null,
        ReportType? reportType = null,
        CancellationToken cancellationToken = default);
}
