namespace InsightVault.API.DTOs.Common;

public sealed record WebSearchOptionsDto(
    bool? Enabled = null,
    ApiWebSearchProvider? Provider = null,
    int? MaxResults = null);
