namespace InsightVault.API.DTOs.Billing;

public sealed record CheckoutSessionDto(
    Guid PaymentOrderId,
    long OrderCode,
    string ProductCode,
    long AmountVnd,
    string CheckoutUrl,
    DateTimeOffset? ExpiresAt);
