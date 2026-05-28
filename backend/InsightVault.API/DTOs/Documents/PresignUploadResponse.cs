namespace InsightVault.API.DTOs.Documents;

public sealed record PresignUploadResponse(
    Guid DocumentId,
    string UploadUrl,
    string ObjectKey,
    DateTimeOffset ExpiresAt,
    IReadOnlyDictionary<string, string> RequiredHeaders);
