using InsightVault.API.Application.Services.Reports;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Tests;

public sealed class ReportVersioningTests
{
    [Fact]
    public void GetNextVersionNumber_returns_one_for_new_group()
    {
        var workspaceId = Guid.NewGuid();
        var reportGroupId = Guid.NewGuid();

        var nextVersion = ReportVersioning.GetNextVersionNumber(
            Enumerable.Empty<Report>().AsQueryable(),
            workspaceId,
            reportGroupId);

        Assert.Equal(1, nextVersion);
    }

    [Fact]
    public void GetNextVersionNumber_returns_next_version_for_existing_group_in_workspace()
    {
        var workspaceId = Guid.NewGuid();
        var reportGroupId = Guid.NewGuid();
        var reports = new[]
        {
            CreateReport(workspaceId, reportGroupId, 1),
            CreateReport(workspaceId, reportGroupId, 3),
            CreateReport(Guid.NewGuid(), reportGroupId, 9),
            CreateReport(workspaceId, Guid.NewGuid(), 7)
        }.AsQueryable();

        var nextVersion = ReportVersioning.GetNextVersionNumber(
            reports,
            workspaceId,
            reportGroupId);

        Assert.Equal(4, nextVersion);
    }

    private static Report CreateReport(
        Guid workspaceId,
        Guid reportGroupId,
        int versionNumber)
    {
        return new Report
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            ReportGroupId = reportGroupId,
            VersionNumber = versionNumber,
            Title = "Report",
            ReportType = ReportType.SummaryReport,
            MarkdownContent = "# Report",
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };
    }
}
