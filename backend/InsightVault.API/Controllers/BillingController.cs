using InsightVault.API.Application.Abstractions.Services.Billing;
using InsightVault.API.DTOs.Billing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
    [HttpGet("vnpay/ipn")]
    public async Task<ActionResult<VnPayIpnResponseDto>> HandleVnPayIpn(
        CancellationToken cancellationToken)
    {
        var parameters = Request.Query.ToDictionary(
            pair => pair.Key,
            pair => pair.Value.ToString(),
            StringComparer.Ordinal);
        var outcome = await billingService.HandlePaymentNotificationAsync(
            parameters,
            cancellationToken);

        return Ok(outcome switch
        {
            PaymentNotificationOutcome.Applied or PaymentNotificationOutcome.Acknowledged =>
                new VnPayIpnResponseDto("00", "Confirm Success"),
            PaymentNotificationOutcome.AlreadyProcessed =>
                new VnPayIpnResponseDto("02", "Order already confirmed"),
            PaymentNotificationOutcome.OrderNotFound =>
                new VnPayIpnResponseDto("01", "Order not found"),
            PaymentNotificationOutcome.InvalidAmount =>
                new VnPayIpnResponseDto("04", "Invalid amount"),
            PaymentNotificationOutcome.InvalidSignature =>
                new VnPayIpnResponseDto("97", "Invalid signature"),
            _ => new VnPayIpnResponseDto("99", "Unknown error")
        });
    }

    [AllowAnonymous]
    [HttpGet("vnpay/return")]
    public async Task<ActionResult<PaymentReturnResponseDto>> HandleVnPayReturn(
        CancellationToken cancellationToken)
    {
        var parameters = Request.Query.ToDictionary(
            pair => pair.Key,
            pair => pair.Value.ToString(),
            StringComparer.Ordinal);
        var outcome = await billingService.HandlePaymentNotificationAsync(
            parameters,
            cancellationToken);

        return Ok(new PaymentReturnResponseDto(
            outcome.ToString().ToLowerInvariant(),
            outcome is PaymentNotificationOutcome.Applied
                or PaymentNotificationOutcome.AlreadyProcessed,
            GetReturnMessage(outcome)));
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
