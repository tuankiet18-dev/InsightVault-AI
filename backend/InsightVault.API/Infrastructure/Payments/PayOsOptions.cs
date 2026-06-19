namespace InsightVault.API.Infrastructure.Payments;

public sealed class PayOsOptions
{
    public bool Enabled { get; set; }
    public string ClientId { get; set; } = string.Empty;
    public string ApiKey { get; set; } = string.Empty;
    public string ChecksumKey { get; set; } = string.Empty;
    public string ReturnUrl { get; set; } =
        "http://localhost:5173/billing/return";
    public string CancelUrl { get; set; } =
        "http://localhost:5173/billing/return";
    public int CheckoutExpiryMinutes { get; set; } = 15;
}
