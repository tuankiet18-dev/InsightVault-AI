using InsightVault.API.DTOs.AiJobs;

namespace InsightVault.API.DTOs.Admin;

public sealed record UserDashboardDto(
    int WorkspaceCount,
    int FolderCount,
    int DocumentCount,
    int CompletedDocumentCount,
    int ProcessingDocumentCount,
    int FailedDocumentCount,
    int ReportCount,
    IReadOnlyList<AiJobDto> RecentJobs);
