using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Invitations;

public sealed record CreateWorkspaceInvitationRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; init; } = string.Empty;

    [JsonRequired]
    public ApiWorkspaceRole Role { get; init; }
}
