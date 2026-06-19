using InsightVault.API.DTOs.AiJobs;

namespace InsightVault.API.DTOs.Admin;

public sealed record AdminAiJobDetailDto(
    AiJobDto Job,
    Guid? CreatedById,
    string? CreatedByEmail,
    string InputPayload,
    string OutputPayload,
    string? ErrorMessage,
    DateTimeOffset? StartedAt,
    DateTimeOffset? CompletedAt);
