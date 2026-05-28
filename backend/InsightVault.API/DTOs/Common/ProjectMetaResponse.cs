namespace InsightVault.API.DTOs.Common;

public sealed record ProjectMetaResponse(
    string Name,
    string Description,
    IReadOnlyList<string> MvpCapabilities);
