namespace InsightVault.API.DTOs.Documents;

public sealed record DocumentOriginalAccessResponse(
    string FileName,
    string ContentType,
    string PreviewKind,
    bool CanPreviewInline,
    string DownloadUrl,
    DateTimeOffset ExpiresAt);
