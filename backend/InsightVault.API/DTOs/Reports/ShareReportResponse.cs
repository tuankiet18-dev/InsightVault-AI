namespace InsightVault.API.DTOs.Reports;

public sealed record ShareReportResponse(
    bool IsPublic,
    string? PublicToken,
    string? ShareUrl,
    DateTimeOffset? ExpiresAt);
