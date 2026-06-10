using InsightVault.API.Domain.Entities;

namespace InsightVault.API.Application.Services.Reports;

public static class ReportVersioning
{
    public static int GetNextVersionNumber(
        IQueryable<Report> reports,
        Guid workspaceId,
        Guid reportGroupId)
    {
        var latestVersion = reports
            .Where(report => report.WorkspaceId == workspaceId
                && report.ReportGroupId == reportGroupId)
            .Select(report => (int?)report.VersionNumber)
            .Max();

        return (latestVersion ?? 0) + 1;
    }
}
