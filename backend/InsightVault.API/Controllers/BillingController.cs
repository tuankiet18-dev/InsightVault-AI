using InsightVault.API.Application.Abstractions.Services.Billing;
using InsightVault.API.DTOs.Billing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;

namespace InsightVault.API.Controllers;

[ApiController]
[Route("api/billing")]
public sealed class BillingController(IBillingService billingService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("plans")]
    public async Task<ActionResult<IReadOnlyList<BillingPlanDto>>> ListPlans(
        CancellationToken cancellationToken)
    {
        return Ok(await billingService.ListPlansAsync(cancellationToken));
    }

    [AllowAnonymous]
    [HttpGet("credit-packages")]
    public async Task<ActionResult<IReadOnlyList<CreditPackageDto>>> ListCreditPackages(
        CancellationToken cancellationToken)
    {
        return Ok(await billingService.ListCreditPackagesAsync(cancellationToken));
    }

    [Authorize]
    [HttpGet("/api/workspaces/{workspaceId:guid}/billing")]
    public async Task<ActionResult<BillingSummaryDto>> GetWorkspaceBilling(
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        return Ok(await billingService.GetWorkspaceSummaryAsync(
            workspaceId,
            cancellationToken));
    }

    [Authorize]
    [HttpPost("/api/workspaces/{workspaceId:guid}/billing/checkout")]
    public async Task<ActionResult<CheckoutSessionDto>> CreateCheckout(
        Guid workspaceId,
        CreateCheckoutRequest request,
        CancellationToken cancellationToken)
    {
        var checkout = await billingService.CreateCheckoutAsync(
            workspaceId,
            request,
            HttpContext.Connection.RemoteIpAddress?.MapToIPv4().ToString() ?? "127.0.0.1",
            cancellationToken);

        return Created(checkout.CheckoutUrl, checkout);
    }

    [AllowAnonymous]
    [HttpPost("payos/webhook")]
    public async Task<ActionResult<PaymentReturnResponseDto>> HandlePayOsWebhook(
        [FromBody] JsonElement payload,
        CancellationToken cancellationToken)
    {
        var outcome = await billingService.HandlePaymentWebhookAsync(
            payload,
            cancellationToken);

        return Ok(ToPaymentReturnResponse(outcome));
    }

    [AllowAnonymous]
    [HttpGet("payos/return")]
    public async Task<ActionResult<PaymentReturnResponseDto>> HandlePayOsReturn(
        CancellationToken cancellationToken)
    {
        var parameters = Request.Query.ToDictionary(
            pair => pair.Key,
            pair => pair.Value.ToString(),
            StringComparer.Ordinal);
        var outcome = await billingService.HandlePaymentReturnAsync(
            parameters,
            cancellationToken);

        return Ok(ToPaymentReturnResponse(outcome));
    }

    private static PaymentReturnResponseDto ToPaymentReturnResponse(
        PaymentNotificationOutcome outcome)
    {
        return new PaymentReturnResponseDto(
            outcome.ToString().ToLowerInvariant(),
            outcome is PaymentNotificationOutcome.Applied
                or PaymentNotificationOutcome.AlreadyProcessed,
            GetReturnMessage(outcome));
    }

    private static string GetReturnMessage(PaymentNotificationOutcome outcome)
    {
        return outcome switch
        {
            PaymentNotificationOutcome.Applied =>
                "Payment confirmed and workspace billing was updated.",
            PaymentNotificationOutcome.AlreadyProcessed =>
                "This payment was already confirmed.",
            PaymentNotificationOutcome.Acknowledged =>
                "The transaction was not successful.",
            PaymentNotificationOutcome.OrderNotFound =>
                "Payment order was not found.",
            PaymentNotificationOutcome.InvalidAmount =>
                "Payment amount does not match the order.",
            PaymentNotificationOutcome.InvalidSignature =>
                "Payment signature is invalid.",
            _ => "Payment data is invalid."
        };
    }
}
