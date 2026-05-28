namespace InsightVault.API.DTOs.Workspaces;

public sealed record UpdateWorkspaceRequest(
    string? Name = null,
    string? Description = null,
    bool? IsArchived = null);
