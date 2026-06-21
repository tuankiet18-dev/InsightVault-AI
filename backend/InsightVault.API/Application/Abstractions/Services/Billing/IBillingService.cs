using InsightVault.API.DTOs.Billing;
using System.Text.Json;

namespace InsightVault.API.Application.Abstractions.Services.Billing;

public interface IBillingService
{
    Task<IReadOnlyList<BillingPlanDto>> ListPlansAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CreditPackageDto>> ListCreditPackagesAsync(
        CancellationToken cancellationToken = default);

    Task<BillingSummaryDto> GetAccountSummaryAsync(
        CancellationToken cancellationToken = default);

    Task<CheckoutSessionDto> CreateCheckoutAsync(
        CreateCheckoutRequest request,
        string clientIp,
        CancellationToken cancellationToken = default);

    Task<PaymentNotificationOutcome> HandlePaymentWebhookAsync(
        JsonElement payload,
        CancellationToken cancellationToken = default);

    Task<PaymentNotificationOutcome> HandlePaymentReturnAsync(
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
