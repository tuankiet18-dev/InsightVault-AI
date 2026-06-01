using System.ComponentModel.DataAnnotations;

namespace InsightVault.API.DTOs.Workspaces;

public sealed record CreateWorkspaceRequest(
    [Required]
    [MinLength(1)]
    string Name,
    string? Description = null);
