using System.Text.Json;

namespace InsightVault.API.Application.Abstractions.Payments;

public interface IPaymentGateway
{
    string ProviderName { get; }

    Task<PaymentCheckoutResult> CreateCheckoutAsync(
        PaymentCheckoutRequest request,
        CancellationToken cancellationToken = default);

    Task<VerifiedPayment> VerifyWebhookAsync(
        JsonElement payload,
        CancellationToken cancellationToken = default);
}

public sealed record PaymentCheckoutRequest(
    long OrderCode,
    long AmountVnd,
    string Description,
    string BuyerName,
    string BuyerEmail,
    string ReturnUrl,
    string CancelUrl,
    DateTimeOffset ExpiresAt);

public sealed record PaymentCheckoutResult(
    string PaymentLinkId,
    string CheckoutUrl);

public sealed record VerifiedPayment(
    long OrderCode,
    long AmountVnd,
    string? PaymentLinkId,
    string? Reference,
    bool IsSuccessful);
