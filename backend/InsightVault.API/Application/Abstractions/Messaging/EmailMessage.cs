namespace InsightVault.API.Application.Abstractions.Messaging;

public record EmailMessage(
    string ToEmail,
    string Subject,
    string HtmlBody);
