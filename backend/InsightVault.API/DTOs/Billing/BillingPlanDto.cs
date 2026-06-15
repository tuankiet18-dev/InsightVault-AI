namespace InsightVault.API.DTOs.Billing;

public sealed record BillingPlanDto(
    string Code,
    string Name,
    string Description,
    long PriceVnd,
    int BillingPeriodMonths,
    int IncludedCredits,
    int MaxMembers,
    long StorageLimitBytes);
