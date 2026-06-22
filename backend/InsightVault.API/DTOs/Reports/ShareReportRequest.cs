namespace InsightVault.API.DTOs.Reports;

public sealed record ShareReportRequest(
    bool IsPublic,
    int? ExpireAfterDays = null);
