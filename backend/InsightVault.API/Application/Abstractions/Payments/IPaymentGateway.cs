namespace InsightVault.API.Application.Abstractions.Payments;

public interface IPaymentGateway
{
    string ProviderName { get; }

    Task<PaymentCheckoutResult> CreateCheckoutAsync(
        PaymentCheckoutRequest request,
        CancellationToken cancellationToken = default);

    Task<VerifiedPayment> VerifyNotificationAsync(
        IReadOnlyDictionary<string, string> parameters,
        CancellationToken cancellationToken = default);
}

public sealed record PaymentCheckoutRequest(
    long OrderCode,
    long AmountVnd,
    string Description,
    string BuyerName,
    string BuyerEmail,
    string ClientIp,
    DateTimeOffset CreatedAt,
    DateTimeOffset ExpiresAt);

public sealed record PaymentCheckoutResult(
    string PaymentLinkId,
    string CheckoutUrl);

public sealed record VerifiedPayment(
    long OrderCode,
    long AmountVnd,
    string? PaymentLinkId,
    string? Reference,
    bool IsSignatureValid,
    bool IsSuccessful);

public static class VerifiedPayments
{
    public static VerifiedPayment InvalidSignature => new(
        0,
        0,
        null,
        null,
        IsSignatureValid: false,
        IsSuccessful: false);

    public static VerifiedPayment InvalidData => new(
        0,
        0,
        null,
        null,
        IsSignatureValid: true,
        IsSuccessful: false);
}
