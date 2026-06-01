namespace InsightVault.API.Common.Errors;

public sealed class ApiException(
    int statusCode,
    string errorCode,
    string message,
    object? details = null) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
    public string ErrorCode { get; } = errorCode;
    public object? Details { get; } = details;
}
