using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Domain.Entities;

public sealed class CreditLedgerEntry
{
    public Guid Id { get; set; }
    public Guid UserSubscriptionId { get; set; }
    public Guid UserId { get; set; }
    public Guid? WorkspaceId { get; set; }
    public Guid? AiJobId { get; set; }
    public Guid? PaymentOrderId { get; set; }
    public CreditEntryType EntryType { get; set; }
    public CreditBucket Bucket { get; set; }
    public int Credits { get; set; }
    public string UsageType { get; set; } = string.Empty;
    public string IdempotencyKey { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public UserSubscription UserSubscription { get; set; } = null!;
    public User User { get; set; } = null!;
    public Workspace? Workspace { get; set; }
    public AiJob? AiJob { get; set; }
    public PaymentOrder? PaymentOrder { get; set; }
}
