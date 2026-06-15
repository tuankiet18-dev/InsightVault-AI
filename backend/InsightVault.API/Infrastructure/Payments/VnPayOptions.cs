namespace InsightVault.API.Infrastructure.Payments;

public sealed class VnPayOptions
{
    public bool Enabled { get; set; }
    public string PaymentUrl { get; set; } =
        "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    public string TmnCode { get; set; } = string.Empty;
    public string HashSecret { get; set; } = string.Empty;
    public string ReturnUrl { get; set; } =
        "http://localhost:5173/billing/return";
    public int CheckoutExpiryMinutes { get; set; } = 15;
}
