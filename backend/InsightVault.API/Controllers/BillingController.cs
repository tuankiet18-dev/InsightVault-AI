using System.Text.Json;
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
            cancellationToken);

        return Created(checkout.CheckoutUrl, checkout);
    }

    [AllowAnonymous]
    [HttpPost("payos/webhook")]
    public async Task<ActionResult<PaymentWebhookResultDto>> HandlePayOsWebhook(
        [FromBody] JsonElement payload,
        CancellationToken cancellationToken)
    {
        var applied = await billingService.HandleWebhookAsync(payload, cancellationToken);
        return Ok(new PaymentWebhookResultDto(applied));
    }
}
