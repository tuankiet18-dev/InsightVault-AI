namespace InsightVault.API.DTOs.Common;

public sealed record ApiErrorDto(
    string ErrorCode,
    string Message,
    object? Details = null);
