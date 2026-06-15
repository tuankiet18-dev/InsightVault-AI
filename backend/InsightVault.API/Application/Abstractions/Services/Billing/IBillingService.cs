using InsightVault.API.DTOs.Billing;

namespace InsightVault.API.Application.Abstractions.Services.Billing;

public interface IBillingService
{
    Task<IReadOnlyList<BillingPlanDto>> ListPlansAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CreditPackageDto>> ListCreditPackagesAsync(
        CancellationToken cancellationToken = default);

    Task<BillingSummaryDto> GetWorkspaceSummaryAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<CheckoutSessionDto> CreateCheckoutAsync(
        Guid workspaceId,
        CreateCheckoutRequest request,
        string clientIp,
        CancellationToken cancellationToken = default);

    Task<PaymentNotificationOutcome> HandlePaymentNotificationAsync(
        IReadOnlyDictionary<string, string> parameters,
        CancellationToken cancellationToken = default);
}

public enum PaymentNotificationOutcome
{
    Applied,
    Acknowledged,
    AlreadyProcessed,
    OrderNotFound,
    InvalidAmount,
    InvalidSignature,
    InvalidData
}
