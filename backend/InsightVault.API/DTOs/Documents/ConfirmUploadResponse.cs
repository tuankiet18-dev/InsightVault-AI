using InsightVault.API.DTOs.AiJobs;

namespace InsightVault.API.DTOs.Documents;

public sealed record ConfirmUploadResponse(
    DocumentDto Document,
    AiJobDto AiJob);
