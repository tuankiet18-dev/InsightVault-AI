using System.ComponentModel.DataAnnotations;

namespace InsightVault.API.DTOs.Auth;

public sealed record GoogleLoginRequest(
    [Required]
    [MinLength(1)]
    string IdToken);
