namespace InsightVault.API.Application.Abstractions.Services.Billing;

public interface ICreditService
{
    Task<Domain.Entities.WorkspaceSubscription> EnsureActiveSubscriptionAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task ConsumeAsync(
        Guid workspaceId,
        Guid aiJobId,
        int credits,
        string usageType,
        CancellationToken cancellationToken = default);

    Task RefundAsync(
        Guid workspaceId,
        Guid aiJobId,
        string usageType,
        CancellationToken cancellationToken = default);
}
