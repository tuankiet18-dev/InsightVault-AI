namespace InsightVault.API.DTOs.Admin;

public sealed record AdminBillingOverviewDto(
    long TotalRevenueVnd,
    long PaidRevenueVnd,
    int PaymentOrderCount,
    int PaidOrderCount,
    int PendingOrderCount,
    int ActiveSubscriptionCount,
    IReadOnlyList<AdminPaymentOrderDto> RecentOrders,
    IReadOnlyList<AdminSubscriptionPlanDto> Plans,
    IReadOnlyList<AdminCreditPackageDto> CreditPackages);

public sealed record AdminPaymentOrderDto(
    Guid Id,
    Guid WorkspaceId,
    string WorkspaceName,
    Guid CreatedById,
    string CreatedByEmail,
    string PurchaseType,
    string Status,
    string Provider,
    long AmountVnd,
    DateTimeOffset? PaidAt,
    DateTimeOffset CreatedAt);

public sealed record AdminSubscriptionPlanDto(
    Guid Id,
    string Code,
    string Name,
    string Description,
    long PriceVnd,
    int BillingPeriodMonths,
    int IncludedCredits,
    int MaxMembers,
    long StorageLimitBytes,
    bool IsActive,
    int DisplayOrder);

public sealed record AdminCreditPackageDto(
    Guid Id,
    string Code,
    string Name,
    long PriceVnd,
    int Credits,
    bool IsActive,
    int DisplayOrder);

public sealed record UpdateAdminSubscriptionPlanRequest(
    string? Name = null,
    string? Description = null,
    long? PriceVnd = null,
    int? IncludedCredits = null,
    int? MaxMembers = null,
    long? StorageLimitBytes = null,
    bool? IsActive = null,
    int? DisplayOrder = null);

public sealed record UpdateAdminCreditPackageRequest(
    string? Name = null,
    long? PriceVnd = null,
    int? Credits = null,
    bool? IsActive = null,
    int? DisplayOrder = null);
