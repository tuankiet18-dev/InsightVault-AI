namespace InsightVault.API.DTOs.Billing;

public sealed record BillingSummaryDto(
    Guid WorkspaceId,
    BillingPlanDto Plan,
    string Status,
    int RecurringCreditsRemaining,
    int TopUpCreditsRemaining,
    int TotalCreditsRemaining,
    DateTimeOffset CurrentPeriodStart,
    DateTimeOffset CurrentPeriodEnd,
    bool CancelAtPeriodEnd);
