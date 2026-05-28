namespace InsightVault.API.DTOs.Workspaces;

public sealed record CreateWorkspaceRequest(
    string Name,
    string? Description = null);
