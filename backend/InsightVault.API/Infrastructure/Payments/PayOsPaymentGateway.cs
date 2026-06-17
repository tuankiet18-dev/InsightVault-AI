using InsightVault.API.Application.Abstractions.Payments;
using Microsoft.Extensions.Options;
using PayOS;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;
using System.Text.Json;

namespace InsightVault.API.Infrastructure.Payments;

public sealed class PayOsPaymentGateway : IPaymentGateway
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    private readonly PayOSClient client;

    public PayOsPaymentGateway(IOptions<PayOsOptions> options)
    {
        var value = options.Value;
        client = new PayOSClient(new PayOSOptions
        {
            ClientId = value.ClientId,
            ApiKey = value.ApiKey,
            ChecksumKey = value.ChecksumKey
        });
        Options = value;
    }

    public string ProviderName => "payos";

    private PayOsOptions Options { get; }

    public async Task<PaymentCheckoutResult> CreateCheckoutAsync(
        PaymentCheckoutRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await client.PaymentRequests.CreateAsync(
            new CreatePaymentLinkRequest
            {
                OrderCode = request.OrderCode,
                Amount = (int)request.AmountVnd,
                Description = request.Description,
                BuyerName = request.BuyerName,
                BuyerEmail = request.BuyerEmail,
                ReturnUrl = Options.ReturnUrl,
                CancelUrl = Options.CancelUrl,
                ExpiredAt = request.ExpiresAt.ToUnixTimeSeconds()
            },
            requestOptions: null);

        return new PaymentCheckoutResult(
            response.PaymentLinkId,
            response.CheckoutUrl);
    }

    public async Task<VerifiedPayment> VerifyWebhookAsync(
        JsonElement payload,
        CancellationToken cancellationToken = default)
    {
        Webhook? webhook;
        try
        {
            webhook = payload.Deserialize<Webhook>(JsonOptions);
        }
        catch (JsonException)
        {
            return VerifiedPayments.InvalidData;
        }

        if (webhook is null)
        {
            return VerifiedPayments.InvalidData;
        }

        WebhookData verifiedData;
        try
        {
            verifiedData = await client.Webhooks.VerifyAsync(webhook);
        }
        catch
        {
            return VerifiedPayments.InvalidSignature;
        }

        return FromWebhookData(verifiedData);
    }

    public async Task<VerifiedPayment> VerifyReturnAsync(
        IReadOnlyDictionary<string, string> parameters,
        CancellationToken cancellationToken = default)
    {
        if (!TryGetOrderCode(parameters, out var orderCode))
        {
            return VerifiedPayments.InvalidData;
        }

        PaymentLink paymentLink;
        try
        {
            paymentLink = await client.PaymentRequests.GetAsync(
                orderCode,
                requestOptions: null);
        }
        catch
        {
            return VerifiedPayments.InvalidData;
        }

        return FromPaymentLink(paymentLink);
    }

    private static VerifiedPayment FromWebhookData(WebhookData data)
    {
        return new VerifiedPayment(
            data.OrderCode,
            data.Amount,
            data.PaymentLinkId,
            data.Reference,
            IsSignatureValid: true,
            IsSuccessful: string.Equals(data.Code, "00", StringComparison.Ordinal));
    }

    private static VerifiedPayment FromPaymentLink(PaymentLink paymentLink)
    {
        var isPaid = string.Equals(
            paymentLink.Status.ToString(),
            "PAID",
            StringComparison.OrdinalIgnoreCase);
        var reference = paymentLink.Transactions?
            .OrderByDescending(transaction => transaction.TransactionDateTime)
            .FirstOrDefault()
            ?.Reference;

        return new VerifiedPayment(
            paymentLink.OrderCode,
            paymentLink.Amount,
            paymentLink.Id,
            reference,
            IsSignatureValid: true,
            IsSuccessful: isPaid);
    }

    private static bool TryGetOrderCode(
        IReadOnlyDictionary<string, string> parameters,
        out long orderCode)
    {
        orderCode = 0;
        var value = GetValue(parameters, "orderCode")
            ?? GetValue(parameters, "order_code");

        return !string.IsNullOrWhiteSpace(value)
            && long.TryParse(value, out orderCode)
            && orderCode > 0;
    }

    private static string? GetValue(
        IReadOnlyDictionary<string, string> parameters,
        string key)
    {
        return parameters.TryGetValue(key, out var value)
            ? value
            : parameters.FirstOrDefault(
                pair => string.Equals(
                    pair.Key,
                    key,
                    StringComparison.OrdinalIgnoreCase)).Value;
    }
}
