using System.Net;
using System.Security.Cryptography;
using System.Text;
using InsightVault.API.Application.Abstractions.Payments;
using InsightVault.API.Infrastructure.Payments;
using Microsoft.Extensions.Options;

namespace InsightVault.API.Tests;

public sealed class VnPayPaymentGatewayTests
{
    private const string TmnCode = "TESTCODE";
    private const string HashSecret = "test-vnpay-hash-secret";

    [Fact]
    public async Task Checkout_builds_a_signed_sandbox_url()
    {
        var gateway = CreateGateway();
        var createdAt = new DateTimeOffset(2026, 6, 15, 2, 30, 0, TimeSpan.Zero);

        var checkout = await gateway.CreateCheckoutAsync(new PaymentCheckoutRequest(
            123456789,
            99_000,
            "IV1234567",
            "Test User",
            "test@example.com",
            "127.0.0.1",
            createdAt,
            createdAt.AddMinutes(15)));

        var uri = new Uri(checkout.CheckoutUrl);
        var parameters = ParseQuery(uri.Query);
        var receivedHash = parameters["vnp_SecureHash"];
        parameters.Remove("vnp_SecureHash");

        Assert.Equal("sandbox.vnpayment.vn", uri.Host);
        Assert.Equal("9900000", parameters["vnp_Amount"]);
        Assert.Equal("20260615093000", parameters["vnp_CreateDate"]);
        Assert.Equal("20260615094500", parameters["vnp_ExpireDate"]);
        Assert.Equal("123456789", parameters["vnp_TxnRef"]);
        Assert.Equal(ComputeSignature(parameters), receivedHash);
    }

    [Fact]
    public async Task Notification_rejects_tampering_and_accepts_a_valid_success()
    {
        var gateway = CreateGateway();
        var parameters = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["vnp_Amount"] = "3900000",
            ["vnp_ResponseCode"] = "00",
            ["vnp_TmnCode"] = TmnCode,
            ["vnp_TransactionNo"] = "14567890",
            ["vnp_TransactionStatus"] = "00",
            ["vnp_TxnRef"] = "987654321"
        };
        parameters["vnp_SecureHash"] = ComputeSignature(parameters);

        var verified = await gateway.VerifyNotificationAsync(parameters);
        Assert.True(verified.IsSignatureValid);
        Assert.True(verified.IsSuccessful);
        Assert.Equal(39_000, verified.AmountVnd);
        Assert.Equal(987654321, verified.OrderCode);

        parameters["vnp_Amount"] = "4900000";
        var tampered = await gateway.VerifyNotificationAsync(parameters);
        Assert.False(tampered.IsSignatureValid);
        Assert.False(tampered.IsSuccessful);
    }

    private static VnPayPaymentGateway CreateGateway()
    {
        return new VnPayPaymentGateway(Options.Create(new VnPayOptions
        {
            Enabled = true,
            PaymentUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
            TmnCode = TmnCode,
            HashSecret = HashSecret,
            ReturnUrl = "http://localhost:5173/billing/success"
        }));
    }

    private static Dictionary<string, string> ParseQuery(string query)
    {
        return query.TrimStart('?')
            .Split('&', StringSplitOptions.RemoveEmptyEntries)
            .Select(part => part.Split('=', 2))
            .ToDictionary(
                part => WebUtility.UrlDecode(part[0]),
                part => WebUtility.UrlDecode(part[1]),
                StringComparer.Ordinal);
    }

    private static string ComputeSignature(
        IReadOnlyDictionary<string, string> parameters)
    {
        var signedData = string.Join(
            '&',
            parameters
                .Where(parameter =>
                    parameter.Key.StartsWith("vnp_", StringComparison.Ordinal)
                    && parameter.Key is not "vnp_SecureHash" and not "vnp_SecureHashType"
                    && !string.IsNullOrEmpty(parameter.Value))
                .OrderBy(parameter => parameter.Key, StringComparer.Ordinal)
                .Select(parameter =>
                    $"{WebUtility.UrlEncode(parameter.Key)}={WebUtility.UrlEncode(parameter.Value)}"));

        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(HashSecret));
        return Convert.ToHexStringLower(
            hmac.ComputeHash(Encoding.UTF8.GetBytes(signedData)));
    }
}
