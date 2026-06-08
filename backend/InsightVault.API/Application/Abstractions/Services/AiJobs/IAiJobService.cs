using InsightVault.API.DTOs.AiJobs;

namespace InsightVault.API.Application.Abstractions.Services.AiJobs;

public interface IAiJobService
{
    Task<IReadOnlyList<AiJobDto>> ListByWorkspaceAsync(
        Guid workspaceId,
        string? status = null,
        string? type = null,
        CancellationToken cancellationToken = default);

    Task<AiJobDto> GetByIdAsync(
        Guid jobId,
        CancellationToken cancellationToken = default);

    Task<AiJobDto> RetryAsync(
        Guid jobId,
        CancellationToken cancellationToken = default);
}
