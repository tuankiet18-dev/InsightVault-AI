using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Domain.Entities;

public sealed class PaymentOrder
{
    public Guid Id { get; set; }
    public Guid CreatedById { get; set; }
    public Guid? PlanId { get; set; }
    public Guid? CreditPackageId { get; set; }
    public PaymentPurchaseType PurchaseType { get; set; }
    public PaymentOrderStatus Status { get; set; } = PaymentOrderStatus.Pending;
    public string Provider { get; set; } = string.Empty;
    public long ProviderOrderCode { get; set; }
    public string? ProviderPaymentLinkId { get; set; }
    public string? ProviderReference { get; set; }
    public long AmountVnd { get; set; }
    public string? CheckoutUrl { get; set; }
    public DateTimeOffset? ExpiresAt { get; set; }
    public DateTimeOffset? PaidAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public User CreatedBy { get; set; } = null!;
    public SubscriptionPlan? Plan { get; set; }
    public CreditPackage? CreditPackage { get; set; }
    public List<CreditLedgerEntry> CreditLedgerEntries { get; set; } = [];
}
