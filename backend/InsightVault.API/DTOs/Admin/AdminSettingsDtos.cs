namespace InsightVault.API.DTOs.Admin;

public sealed record AdminSystemSettingsDto(
    string AiServiceBaseUrl,
    string DefaultAiModel,
    int DefaultWorkspaceCredits,
    bool WebSearchEnabled,
    bool SmtpEnabled,
    bool PayOsEnabled,
    bool Persisted);

public sealed record UpdateAdminSystemSettingsRequest(
    string? DefaultAiModel = null,
    int? DefaultWorkspaceCredits = null,
    bool? WebSearchEnabled = null);
