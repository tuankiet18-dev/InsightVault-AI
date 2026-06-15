using System.Text.Json;
using InsightVault.API.Application.Abstractions.Payments;
using Microsoft.Extensions.Options;
using PayOS;
using PayOS.Models.V2.PaymentRequests;
using PayOS.Models.Webhooks;

namespace InsightVault.API.Infrastructure.Payments;

public sealed class PayOsPaymentGateway : IPaymentGateway
{
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
    }

    public string ProviderName => "payos";

    public async Task<PaymentCheckoutResult> CreateCheckoutAsync(
        PaymentCheckoutRequest request,
        CancellationToken cancellationToken = default)
    {
        var response = await client.PaymentRequests.CreateAsync(
            new CreatePaymentLinkRequest
            {
                OrderCode = request.OrderCode,
                Amount = request.AmountVnd,
                Description = request.Description,
                BuyerName = request.BuyerName,
                BuyerEmail = request.BuyerEmail,
                ReturnUrl = request.ReturnUrl,
                CancelUrl = request.CancelUrl,
                ExpiredAt = request.ExpiresAt.ToUnixTimeSeconds()
            });

        return new PaymentCheckoutResult(
            response.PaymentLinkId,
            response.CheckoutUrl);
    }

    public async Task<VerifiedPayment> VerifyWebhookAsync(
        JsonElement payload,
        CancellationToken cancellationToken = default)
    {
        var webhook = payload.Deserialize<Webhook>()
            ?? throw new InvalidOperationException("payOS webhook payload is empty.");
        var data = await client.Webhooks.VerifyAsync(webhook);

        return new VerifiedPayment(
            data.OrderCode,
            data.Amount,
            data.PaymentLinkId,
            data.Reference,
            string.Equals(data.Code, "00", StringComparison.Ordinal));
    }
}
