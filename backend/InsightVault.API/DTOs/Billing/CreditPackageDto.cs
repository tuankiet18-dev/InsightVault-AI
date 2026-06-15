namespace InsightVault.API.DTOs.Billing;

public sealed record CreditPackageDto(
    string Code,
    string Name,
    long PriceVnd,
    int Credits);
