namespace InsightVault.API.Application.Abstractions.Services.Billing;

public interface IWorkspaceEntitlementService
{
    Task EnsureCanAddMemberAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task EnsureCanStoreAsync(
        Guid workspaceId,
        long additionalBytes,
        CancellationToken cancellationToken = default);
}
