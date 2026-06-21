namespace InsightVault.API.Domain.Entities;

public sealed class SubscriptionPlan
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public long PriceVnd { get; set; }
    public int BillingPeriodMonths { get; set; } = 1;
    public int IncludedCredits { get; set; }
    public int MaxMembers { get; set; }
    public long StorageLimitBytes { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public List<UserSubscription> UserSubscriptions { get; set; } = [];
    public List<PaymentOrder> PaymentOrders { get; set; } = [];
}
