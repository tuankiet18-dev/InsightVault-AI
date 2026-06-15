using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Domain.Entities;

public sealed class WorkspaceSubscription
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid PlanId { get; set; }
    public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
    public int RecurringCreditsRemaining { get; set; }
    public int TopUpCreditsRemaining { get; set; }
    public DateTimeOffset CurrentPeriodStart { get; set; }
    public DateTimeOffset CurrentPeriodEnd { get; set; }
    public bool CancelAtPeriodEnd { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public SubscriptionPlan Plan { get; set; } = null!;
    public List<CreditLedgerEntry> CreditLedgerEntries { get; set; } = [];
}
