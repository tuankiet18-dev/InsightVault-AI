namespace InsightVault.API.Application.Abstractions.Services.Billing;

public interface ICreditService
{
    Task<Domain.Entities.UserSubscription> EnsureActiveSubscriptionAsync(
        Guid userId,
        CancellationToken cancellationToken = default);

    Task ConsumeAsync(
        Guid userId,
        Guid workspaceId,
        Guid aiJobId,
        int credits,
        string usageType,
        CancellationToken cancellationToken = default);

    Task RefundAsync(
        Guid userId,
        Guid workspaceId,
        Guid aiJobId,
        string usageType,
        CancellationToken cancellationToken = default);
}
