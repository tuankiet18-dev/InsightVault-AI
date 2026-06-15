namespace InsightVault.API.Application.Abstractions.Services.Emails;

public interface IEmailService
{
    Task SendLoginNotificationAsync(
        string email,
        string fullName,
        DateTimeOffset loginTime,
        CancellationToken cancellationToken = default);

    Task SendWorkspaceInviteAsync(
        string email,
        string inviterName,
        string workspaceName,
        string role,
        string viewInvitationUrl,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken = default);

    Task SendRoleUpdatedAsync(
        string email,
        string workspaceName,
        string newRole,
        CancellationToken cancellationToken = default);

    Task SendRemovedFromWorkspaceAsync(
        string email,
        string workspaceName,
        CancellationToken cancellationToken = default);
}
