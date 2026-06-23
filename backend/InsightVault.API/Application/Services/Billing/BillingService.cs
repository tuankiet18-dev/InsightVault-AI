using InsightVault.API.Application.Abstractions.Payments;
using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Abstractions.Services.Billing;
using InsightVault.API.Application.Abstractions.Services.Workspaces;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.DTOs.Billing;
using InsightVault.API.Infrastructure.Payments;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using System.Text.Json;

namespace InsightVault.API.Application.Services.Billing;

public sealed class BillingService(
    InsightVaultDbContext db,
    ICurrentUserService currentUserService,
    IWorkspacePermissionService workspacePermissionService,
    ICreditService creditService,
    IPaymentGateway paymentGateway,
    IOptions<PayOsOptions> payOsOptions) : IBillingService
{
    public async Task<IReadOnlyList<BillingPlanDto>> ListPlansAsync(
        CancellationToken cancellationToken = default)
    {
        return await db.SubscriptionPlans
            .AsNoTracking()
            .Where(plan => plan.IsActive)
            .OrderBy(plan => plan.DisplayOrder)
            .Select(plan => ToDto(plan))
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CreditPackageDto>> ListCreditPackagesAsync(
        CancellationToken cancellationToken = default)
    {
        return await db.CreditPackages
            .AsNoTracking()
            .Where(package => package.IsActive)
            .OrderBy(package => package.DisplayOrder)
            .Select(package => new CreditPackageDto(
                package.Code,
                package.Name,
                package.PriceVnd,
                package.Credits))
            .ToListAsync(cancellationToken);
    }

    public async Task<BillingSummaryDto> GetWorkspaceSummaryAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(
            workspaceId,
            userId,
            cancellationToken);

        var subscription = await creditService
            .EnsureActiveSubscriptionAsync(workspaceId, cancellationToken);

        return ToSummary(subscription);
    }

    public async Task<CheckoutSessionDto> CreateCheckoutAsync(
        Guid workspaceId,
        CreateCheckoutRequest request,
        string clientIp,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageWorkspaceAsync(
            workspaceId,
            userId,
            cancellationToken);

        if (string.IsNullOrWhiteSpace(request.ProductCode))
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "billing.product_required",
                "Product code is required.");
        }

        var productCode = request.ProductCode.Trim().ToLowerInvariant();
        var plan = await db.SubscriptionPlans.FirstOrDefaultAsync(
            candidate => candidate.Code == productCode && candidate.IsActive,
            cancellationToken);
        var creditPackage = plan is null
            ? await db.CreditPackages.FirstOrDefaultAsync(
                candidate => candidate.Code == productCode && candidate.IsActive,
                cancellationToken)
            : null;

        if (plan is null && creditPackage is null)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "billing.product_not_found",
                "Billing product not found.");
        }

        var amountVnd = plan?.PriceVnd ?? creditPackage!.PriceVnd;
        if (amountVnd <= 0)
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "billing.product_not_purchasable",
                "This product does not require checkout.");
        }

        if (!payOsOptions.Value.Enabled)
        {
            throw new ApiException(
                StatusCodes.Status503ServiceUnavailable,
                "billing.payment_unavailable",
                "Online payment is not configured.");
        }

        var user = await db.Users.AsNoTracking().FirstAsync(
            candidate => candidate.Id == userId,
            cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var expiresAt = now.AddMinutes(payOsOptions.Value.CheckoutExpiryMinutes);
        var orderCode = CreateOrderCode();
        var order = new PaymentOrder
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            CreatedById = userId,
            PlanId = plan?.Id,
            CreditPackageId = creditPackage?.Id,
            PurchaseType = plan is not null
                ? PaymentPurchaseType.Subscription
                : PaymentPurchaseType.CreditTopUp,
            Provider = paymentGateway.ProviderName,
            ProviderOrderCode = orderCode,
            AmountVnd = amountVnd,
            ExpiresAt = expiresAt,
            CreatedAt = now,
            UpdatedAt = now
        };

        db.PaymentOrders.Add(order);
        await db.SaveChangesAsync(cancellationToken);

        try
        {
            var checkout = await paymentGateway.CreateCheckoutAsync(
                new PaymentCheckoutRequest(
                    orderCode,
                    amountVnd,
                    $"IV{orderCode % 10_000_000:0000000}",
                    user.FullName,
                    user.Email,
                    clientIp,
                    now,
                    expiresAt),
                cancellationToken);

            order.ProviderPaymentLinkId = checkout.PaymentLinkId;
            order.CheckoutUrl = checkout.CheckoutUrl;
            order.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);

            return new CheckoutSessionDto(
                order.Id,
                order.ProviderOrderCode,
                productCode,
                order.AmountVnd,
                checkout.CheckoutUrl,
                order.ExpiresAt);
        }
        catch
        {
            order.Status = PaymentOrderStatus.Failed;
            order.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(CancellationToken.None);
            throw;
        }
    }

    public async Task<PaymentNotificationOutcome> HandlePaymentWebhookAsync(
        JsonElement payload,
        CancellationToken cancellationToken = default)
    {
        var verifiedPayment = await paymentGateway.VerifyWebhookAsync(
            payload,
            cancellationToken);

        return await ApplyVerifiedPaymentAsync(
            verifiedPayment,
            cancellationToken);
    }

    public async Task<PaymentNotificationOutcome> HandlePaymentReturnAsync(
        IReadOnlyDictionary<string, string> parameters,
        CancellationToken cancellationToken = default)
    {
        var verifiedPayment = await paymentGateway.VerifyReturnAsync(
            parameters,
            cancellationToken);

        return await ApplyVerifiedPaymentAsync(
            verifiedPayment,
            cancellationToken);
    }

    private async Task<PaymentNotificationOutcome> ApplyVerifiedPaymentAsync(
        VerifiedPayment verifiedPayment,
        CancellationToken cancellationToken)
    {
        if (!verifiedPayment.IsSignatureValid)
        {
            return PaymentNotificationOutcome.InvalidSignature;
        }

        if (verifiedPayment.OrderCode <= 0)
        {
            return PaymentNotificationOutcome.InvalidData;
        }

        await using var transaction = db.Database.IsRelational()
            ? await db.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.ReadCommitted,
                cancellationToken)
            : null;

        var order = await GetLockedPaymentOrderAsync(
            verifiedPayment.OrderCode,
            cancellationToken);

        if (order is null)
        {
            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return PaymentNotificationOutcome.OrderNotFound;
        }

        if (order.Status == PaymentOrderStatus.Paid)
        {
            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return PaymentNotificationOutcome.AlreadyProcessed;
        }

        if (order.AmountVnd != verifiedPayment.AmountVnd)
        {
            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return PaymentNotificationOutcome.InvalidAmount;
        }

        if (!verifiedPayment.IsSuccessful)
        {
            order.Status = PaymentOrderStatus.Failed;
            order.ProviderPaymentLinkId ??= verifiedPayment.PaymentLinkId;
            order.ProviderReference = verifiedPayment.Reference;
            order.UpdatedAt = DateTimeOffset.UtcNow;
            await db.SaveChangesAsync(cancellationToken);

            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return PaymentNotificationOutcome.Acknowledged;
        }

        await LockWorkspaceAsync(order.WorkspaceId, cancellationToken);

        var subscription = await creditService
            .EnsureActiveSubscriptionAsync(order.WorkspaceId, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        if (order.PurchaseType == PaymentPurchaseType.Subscription)
        {
            var plan = order.Plan
                ?? throw new InvalidOperationException("Payment order plan is missing.");
            subscription.PlanId = plan.Id;
            subscription.Plan = plan;
            subscription.Status = SubscriptionStatus.Active;
            subscription.RecurringCreditsRemaining = plan.IncludedCredits;
            subscription.CurrentPeriodStart = now;
            subscription.CurrentPeriodEnd = now.AddMonths(plan.BillingPeriodMonths);
            subscription.CancelAtPeriodEnd = false;

            AddGrant(
                subscription,
                order,
                CreditBucket.Recurring,
                plan.IncludedCredits,
                $"grant:payment:{order.Id:N}:recurring",
                $"Subscription purchase: {plan.Code}",
                now);
        }
        else
        {
            var package = order.CreditPackage
                ?? throw new InvalidOperationException("Payment order credit package is missing.");
            subscription.TopUpCreditsRemaining += package.Credits;

            AddGrant(
                subscription,
                order,
                CreditBucket.TopUp,
                package.Credits,
                $"grant:payment:{order.Id:N}:topup",
                $"Credit top-up: {package.Code}",
                now);
        }

        subscription.UpdatedAt = now;
        order.Status = PaymentOrderStatus.Paid;
        order.ProviderPaymentLinkId ??= verifiedPayment.PaymentLinkId;
        order.ProviderReference = verifiedPayment.Reference;
        order.PaidAt = now;
        order.UpdatedAt = now;
        await db.SaveChangesAsync(cancellationToken);

        if (transaction is not null)
        {
            await transaction.CommitAsync(cancellationToken);
        }

        return PaymentNotificationOutcome.Applied;
    }

    private async Task<PaymentOrder?> GetLockedPaymentOrderAsync(
        long providerOrderCode,
        CancellationToken cancellationToken)
    {
        PaymentOrder? order;
        if (db.Database.ProviderName == "Npgsql.EntityFrameworkCore.PostgreSQL")
        {
            order = await db.PaymentOrders
                .FromSqlInterpolated(
                    $"SELECT * FROM payment_orders WHERE provider_order_code = {providerOrderCode} FOR UPDATE")
                .SingleOrDefaultAsync(cancellationToken);
        }
        else
        {
            order = await db.PaymentOrders.FirstOrDefaultAsync(
                candidate => candidate.ProviderOrderCode == providerOrderCode,
                cancellationToken);
        }

        if (order is null)
        {
            return null;
        }

        if (order.PlanId is not null)
        {
            await db.Entry(order).Reference(candidate => candidate.Plan)
                .LoadAsync(cancellationToken);
        }

        if (order.CreditPackageId is not null)
        {
            await db.Entry(order).Reference(candidate => candidate.CreditPackage)
                .LoadAsync(cancellationToken);
        }

        return order;
    }

    private async Task LockWorkspaceAsync(
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        if (db.Database.ProviderName != "Npgsql.EntityFrameworkCore.PostgreSQL")
        {
            return;
        }

        var workspace = await db.Workspaces
            .FromSqlInterpolated(
                $"SELECT * FROM workspaces WHERE id = {workspaceId} FOR UPDATE")
            .SingleOrDefaultAsync(cancellationToken);

        if (workspace is null)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "workspace.not_found",
                "Workspace not found.");
        }
    }

    private void AddGrant(
        WorkspaceSubscription subscription,
        PaymentOrder order,
        CreditBucket bucket,
        int credits,
        string idempotencyKey,
        string description,
        DateTimeOffset now)
    {
        db.CreditLedgerEntries.Add(new CreditLedgerEntry
        {
            Id = Guid.NewGuid(),
            WorkspaceSubscriptionId = subscription.Id,
            WorkspaceId = subscription.WorkspaceId,
            PaymentOrderId = order.Id,
            EntryType = CreditEntryType.Grant,
            Bucket = bucket,
            Credits = credits,
            UsageType = "purchase",
            IdempotencyKey = idempotencyKey,
            Description = description,
            CreatedAt = now
        });
    }

    private Guid GetRequiredUserId()
    {
        return currentUserService.UserId
            ?? throw new ApiException(
                StatusCodes.Status401Unauthorized,
                "auth.unauthorized",
                "A valid authenticated user is required.");
    }

    private static long CreateOrderCode()
    {
        return DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() * 1000
            + Random.Shared.Next(100, 1000);
    }

    private static BillingPlanDto ToDto(SubscriptionPlan plan)
    {
        return new BillingPlanDto(
            plan.Code,
            plan.Name,
            plan.Description,
            plan.PriceVnd,
            plan.BillingPeriodMonths,
            plan.IncludedCredits,
            plan.MaxMembers,
            plan.StorageLimitBytes);
    }

    private static BillingSummaryDto ToSummary(WorkspaceSubscription subscription)
    {
        return new BillingSummaryDto(
            subscription.WorkspaceId,
            ToDto(subscription.Plan),
            subscription.Status.ToString().ToLowerInvariant(),
            subscription.RecurringCreditsRemaining,
            subscription.TopUpCreditsRemaining,
            subscription.RecurringCreditsRemaining + subscription.TopUpCreditsRemaining,
            subscription.CurrentPeriodStart,
            subscription.CurrentPeriodEnd,
            subscription.CancelAtPeriodEnd);
    }
}
