using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using InsightVault.API.Application.Abstractions.Payments;
using Microsoft.Extensions.Options;

namespace InsightVault.API.Infrastructure.Payments;

public sealed class VnPayPaymentGateway(IOptions<VnPayOptions> options) : IPaymentGateway
{
    private static readonly TimeSpan VietnamUtcOffset = TimeSpan.FromHours(7);

    public string ProviderName => "vnpay";

    public Task<PaymentCheckoutResult> CreateCheckoutAsync(
        PaymentCheckoutRequest request,
        CancellationToken cancellationToken = default)
    {
        var value = options.Value;
        var createdAt = request.CreatedAt.ToOffset(VietnamUtcOffset);
        var expiresAt = request.ExpiresAt.ToOffset(VietnamUtcOffset);
        var parameters = new SortedDictionary<string, string>(StringComparer.Ordinal)
        {
            ["vnp_Version"] = "2.1.0",
            ["vnp_Command"] = "pay",
            ["vnp_TmnCode"] = value.TmnCode,
            ["vnp_Amount"] = checked(request.AmountVnd * 100)
                .ToString(CultureInfo.InvariantCulture),
            ["vnp_CreateDate"] = createdAt.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture),
            ["vnp_CurrCode"] = "VND",
            ["vnp_ExpireDate"] = expiresAt.ToString("yyyyMMddHHmmss", CultureInfo.InvariantCulture),
            ["vnp_IpAddr"] = request.ClientIp,
            ["vnp_Locale"] = "vn",
            ["vnp_OrderInfo"] = request.Description,
            ["vnp_OrderType"] = "other",
            ["vnp_ReturnUrl"] = value.ReturnUrl,
            ["vnp_TxnRef"] = request.OrderCode.ToString(CultureInfo.InvariantCulture)
        };

        var signedData = BuildQueryString(parameters);
        var secureHash = ComputeHmacSha512(value.HashSecret, signedData);
        var checkoutUrl = $"{value.PaymentUrl}?{signedData}&vnp_SecureHash={secureHash}";

        return Task.FromResult(new PaymentCheckoutResult(
            request.OrderCode.ToString(CultureInfo.InvariantCulture),
            checkoutUrl));
    }

    public Task<VerifiedPayment> VerifyNotificationAsync(
        IReadOnlyDictionary<string, string> parameters,
        CancellationToken cancellationToken = default)
    {
        if (!parameters.TryGetValue("vnp_SecureHash", out var receivedHash))
        {
            return Task.FromResult(VerifiedPayments.InvalidSignature);
        }

        if (!parameters.TryGetValue("vnp_TmnCode", out var tmnCode)
            || !string.Equals(tmnCode, options.Value.TmnCode, StringComparison.Ordinal))
        {
            return Task.FromResult(VerifiedPayments.InvalidData);
        }

        var signedParameters = new SortedDictionary<string, string>(StringComparer.Ordinal);
        foreach (var (key, value) in parameters)
        {
            if (key.StartsWith("vnp_", StringComparison.Ordinal)
                && !key.Equals("vnp_SecureHash", StringComparison.Ordinal)
                && !key.Equals("vnp_SecureHashType", StringComparison.Ordinal)
                && !string.IsNullOrEmpty(value))
            {
                signedParameters[key] = value;
            }
        }

        var expectedHash = ComputeHmacSha512(
            options.Value.HashSecret,
            BuildQueryString(signedParameters));
        if (!HashesMatch(receivedHash, expectedHash))
        {
            return Task.FromResult(VerifiedPayments.InvalidSignature);
        }

        if (!TryParseLong(parameters, "vnp_TxnRef", out var orderCode)
            || !TryParseLong(parameters, "vnp_Amount", out var multipliedAmount)
            || multipliedAmount < 0
            || multipliedAmount % 100 != 0)
        {
            return Task.FromResult(VerifiedPayments.InvalidData);
        }

        parameters.TryGetValue("vnp_TransactionNo", out var transactionNumber);
        parameters.TryGetValue("vnp_ResponseCode", out var responseCode);
        parameters.TryGetValue("vnp_TransactionStatus", out var transactionStatus);

        return Task.FromResult(new VerifiedPayment(
            orderCode,
            multipliedAmount / 100,
            orderCode.ToString(CultureInfo.InvariantCulture),
            transactionNumber,
            IsSignatureValid: true,
            IsSuccessful: responseCode == "00" && transactionStatus == "00"));
    }

    private static bool TryParseLong(
        IReadOnlyDictionary<string, string> parameters,
        string key,
        out long value)
    {
        value = 0;
        return parameters.TryGetValue(key, out var rawValue)
            && long.TryParse(
                rawValue,
                NumberStyles.None,
                CultureInfo.InvariantCulture,
                out value);
    }

    private static string BuildQueryString(
        IEnumerable<KeyValuePair<string, string>> parameters)
    {
        return string.Join(
            '&',
            parameters.Select(parameter =>
                $"{WebUtility.UrlEncode(parameter.Key)}={WebUtility.UrlEncode(parameter.Value)}"));
    }

    private static string ComputeHmacSha512(string secret, string data)
    {
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(secret));
        return Convert.ToHexStringLower(hmac.ComputeHash(Encoding.UTF8.GetBytes(data)));
    }

    private static bool HashesMatch(string receivedHash, string expectedHash)
    {
        try
        {
            return CryptographicOperations.FixedTimeEquals(
                Convert.FromHexString(receivedHash),
                Convert.FromHexString(expectedHash));
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
