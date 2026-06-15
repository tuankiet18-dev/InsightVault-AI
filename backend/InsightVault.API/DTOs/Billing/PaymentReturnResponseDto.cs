namespace InsightVault.API.DTOs.Billing;

public sealed record PaymentReturnResponseDto(
    string Status,
    bool Successful,
    string Message);
