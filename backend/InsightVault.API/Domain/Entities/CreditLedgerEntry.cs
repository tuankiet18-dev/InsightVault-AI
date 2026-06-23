using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Domain.Entities;

public sealed class CreditLedgerEntry
{
    public Guid Id { get; set; }
    public Guid WorkspaceSubscriptionId { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid? AiJobId { get; set; }
    public Guid? PaymentOrderId { get; set; }
    public CreditEntryType EntryType { get; set; }
    public CreditBucket Bucket { get; set; }
    public int Credits { get; set; }
    public string UsageType { get; set; } = string.Empty;
    public string IdempotencyKey { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTimeOffset CreatedAt { get; set; }

    public WorkspaceSubscription WorkspaceSubscription { get; set; } = null!;
    public Workspace Workspace { get; set; } = null!;
    public AiJob? AiJob { get; set; }
    public PaymentOrder? PaymentOrder { get; set; }
}
