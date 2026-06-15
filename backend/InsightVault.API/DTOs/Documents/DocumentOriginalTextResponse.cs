namespace InsightVault.API.DTOs.Documents;

public sealed record DocumentOriginalTextResponse(
    string FileName,
    string ContentType,
    string Content);
