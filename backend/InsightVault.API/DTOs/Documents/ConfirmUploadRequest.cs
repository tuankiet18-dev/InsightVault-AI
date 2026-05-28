namespace InsightVault.API.DTOs.Documents;

public sealed record ConfirmUploadRequest(
    long FileSizeBytes,
    string ContentType);
