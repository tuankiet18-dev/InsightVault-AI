using InsightVault.API.DTOs.AiJobs;
using InsightVault.API.DTOs.Reports;

namespace InsightVault.API.Application.Abstractions.Services.Reports;

public interface IReportService
{
    Task<IReadOnlyList<ReportDto>> ListByWorkspaceAsync(
        Guid workspaceId,
        string? type = null,
        CancellationToken cancellationToken = default);

    Task<ReportDto> GetByIdAsync(
        Guid reportId,
        CancellationToken cancellationToken = default);

    Task<AiJobDto> EnqueueReportGenerationAsync(
        Guid workspaceId,
        GenerateReportRequest request,
        CancellationToken cancellationToken = default);

    Task<AiJobDto> EnqueueCompareAsync(
        Guid workspaceId,
        CompareDocumentsRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid reportId,
        CancellationToken cancellationToken = default);

    Task<ShareReportResponse> ShareReportAsync(
        Guid workspaceId,
        Guid reportId,
        ShareReportRequest request,
        CancellationToken cancellationToken = default);

    Task<ReportDto> GetPublicReportAsync(
        string publicToken,
        CancellationToken cancellationToken = default);
}
