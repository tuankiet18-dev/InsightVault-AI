using InsightVault.API.Application.Abstractions.Messaging;
using InsightVault.API.Application.Abstractions.Services.Emails;

namespace InsightVault.API.Infrastructure.Emails;

public sealed class MessagingEmailService(
    IMessagePublisher messagePublisher,
    ILogger<MessagingEmailService> logger) : IEmailService
{
    private static readonly TimeZoneInfo VietnamTimeZone =
        TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
    public async Task SendLoginNotificationAsync(
        string email,
        string fullName,
        DateTimeOffset loginTime,
        CancellationToken cancellationToken = default)
    {
        var loginTimeVietnam = TimeZoneInfo.ConvertTime(loginTime, VietnamTimeZone);

        var subject = "New login to your InsightVault AI account";
        var body = $@"
            <h2>Hello {fullName},</h2>
            <p>We noticed a new login to your InsightVault AI account.</p>
            <p><strong>Time:</strong> {loginTimeVietnam:yyyy-MM-dd HH:mm:ss} (UTC+7)</p>
            <p>If this was you, you can safely ignore this email.</p>
            <p>Thanks,<br/>The InsightVault AI Team</p>
        ";

        var message = new EmailMessage(email, subject, body);
        await TryQueueAsync(message, cancellationToken);
    }

    public async Task SendWorkspaceInviteAsync(
        string email,
        string inviterName,
        string workspaceName,
        string role,
        string viewInvitationUrl,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken = default)
    {
        var expiresAtVietnam = TimeZoneInfo.ConvertTime(expiresAt, VietnamTimeZone);

        var subject = $"You've been invited to join {workspaceName} on InsightVault AI";
        var body = $@"
            <h2>Hello!</h2>
            <p><strong>{inviterName}</strong> has invited you to join the workspace <strong>{workspaceName}</strong> as a <strong>{role}</strong>.</p>
            <p>This invitation was intended for <strong>{email}</strong> and expires on <strong>{expiresAtVietnam:yyyy-MM-dd HH:mm:ss} (UTC+7)</strong>.</p>
            <p>
                <a href=""{viewInvitationUrl}"" style=""display:inline-block;padding:10px 16px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;"">
                    View invitation
                </a>
            </p>
            <p>If the button does not work, copy and paste this link into your browser:</p>
            <p><a href=""{viewInvitationUrl}"">{viewInvitationUrl}</a></p>
            <p>Thanks,<br/>The InsightVault AI Team</p>
        ";

        var message = new EmailMessage(email, subject, body);
        await TryQueueAsync(message, cancellationToken);
    }

    public async Task SendRoleUpdatedAsync(
        string email,
        string workspaceName,
        string newRole,
        CancellationToken cancellationToken = default)
    {
        var subject = $"Your role in {workspaceName} has been updated";
        var body = $@"
            <h2>Hello!</h2>
            <p>Your role in the workspace <strong>{workspaceName}</strong> has been updated to <strong>{newRole}</strong>.</p>
            <p>Thanks,<br/>The InsightVault AI Team</p>
        ";

        var message = new EmailMessage(email, subject, body);
        await TryQueueAsync(message, cancellationToken);
    }

    public async Task SendRemovedFromWorkspaceAsync(
        string email,
        string workspaceName,
        CancellationToken cancellationToken = default)
    {
        var subject = $"You have been removed from {workspaceName}";
        var body = $@"
            <h2>Hello,</h2>
            <p>You have been removed from the workspace <strong>{workspaceName}</strong>.</p>
            <p>If you think this is a mistake, please contact the workspace owner.</p>
            <p>Thanks,<br/>The InsightVault AI Team</p>
        ";

        var message = new EmailMessage(email, subject, body);
        await TryQueueAsync(message, cancellationToken);
    }

    private async Task TryQueueAsync(
        EmailMessage message,
        CancellationToken cancellationToken)
    {
        try
        {
            await messagePublisher.PublishEmailAsync(message, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Could not queue email with subject {Subject} for {Email}. The primary operation will continue.",
                message.Subject,
                message.ToEmail);
        }
    }
}
