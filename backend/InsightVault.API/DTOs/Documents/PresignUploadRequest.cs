namespace InsightVault.API.DTOs.Documents;

public sealed record PresignUploadRequest(
    Guid? FolderId,
    string FileName,
    long FileSizeBytes,
    string ContentType);
