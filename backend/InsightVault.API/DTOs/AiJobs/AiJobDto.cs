using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.AiJobs;

public sealed record AiJobDto(
    Guid Id,
    Guid? WorkspaceId,
    Guid? DocumentId,
    ApiAiJobType JobType,
    ApiAiJobStatus Status,
    int RetryCount,
    string? ErrorMessage,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
