using System.Text.Json;
using InsightVault.API.DTOs.Billing;

namespace InsightVault.API.Application.Abstractions.Services.Billing;

public interface IBillingService
{
    Task<IReadOnlyList<BillingPlanDto>> ListPlansAsync(
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<CreditPackageDto>> ListCreditPackagesAsync(
        CancellationToken cancellationToken = default);

    Task<BillingSummaryDto> GetWorkspaceSummaryAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<CheckoutSessionDto> CreateCheckoutAsync(
        Guid workspaceId,
        CreateCheckoutRequest request,
        CancellationToken cancellationToken = default);

    Task<bool> HandleWebhookAsync(
        JsonElement payload,
        CancellationToken cancellationToken = default);
}
