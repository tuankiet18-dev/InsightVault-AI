namespace InsightVault.API.Application.Services.Invitations;

public sealed class WorkspaceInvitationOptions
{
    public string FrontendBaseUrl { get; set; } = "http://localhost:5173";
    public int ExpiresDays { get; set; } = 7;
}
