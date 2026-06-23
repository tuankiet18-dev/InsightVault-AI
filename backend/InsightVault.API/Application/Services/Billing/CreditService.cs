using InsightVault.API.Application.Abstractions.Services.Billing;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace InsightVault.API.Application.Services.Billing;

public sealed class CreditService(
    InsightVaultDbContext db,
    IOptions<BillingOptions> options) : ICreditService
{
    public async Task ConsumeAsync(
        Guid workspaceId,
        Guid aiJobId,
        int credits,
        string usageType,
        CancellationToken cancellationToken = default)
    {
        if (!options.Value.EnforceCredits || credits <= 0)
        {
            return;
        }

        await using var transaction = db.Database.IsRelational()
            ? await db.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.ReadCommitted,
                cancellationToken)
            : null;

        await LockWorkspaceAsync(workspaceId, cancellationToken);

        var idempotencyPrefix = $"debit:{aiJobId:N}";
        if (await db.CreditLedgerEntries.AnyAsync(
                entry => entry.IdempotencyKey.StartsWith(idempotencyPrefix),
                cancellationToken))
        {
            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return;
        }

        var subscription = await EnsureActiveSubscriptionAsync(workspaceId, cancellationToken);
        var availableCredits = subscription.RecurringCreditsRemaining
            + subscription.TopUpCreditsRemaining;

        if (availableCredits < credits)
        {
            throw new ApiException(
                StatusCodes.Status402PaymentRequired,
                "billing.insufficient_credits",
                "This workspace does not have enough AI credits.",
                new
                {
                    requiredCredits = credits,
                    availableCredits
                });
        }

        var recurringDebit = Math.Min(subscription.RecurringCreditsRemaining, credits);
        var topUpDebit = credits - recurringDebit;
        var now = DateTimeOffset.UtcNow;

        if (recurringDebit > 0)
        {
            subscription.RecurringCreditsRemaining -= recurringDebit;
            db.CreditLedgerEntries.Add(CreateLedgerEntry(
                subscription,
                aiJobId,
                CreditBucket.Recurring,
                -recurringDebit,
                usageType,
                $"{idempotencyPrefix}:recurring",
                CreditEntryType.Debit,
                now));
        }

        if (topUpDebit > 0)
        {
            subscription.TopUpCreditsRemaining -= topUpDebit;
            db.CreditLedgerEntries.Add(CreateLedgerEntry(
                subscription,
                aiJobId,
                CreditBucket.TopUp,
                -topUpDebit,
                usageType,
                $"{idempotencyPrefix}:topup",
                CreditEntryType.Debit,
                now));
        }

        subscription.UpdatedAt = now;
        await db.SaveChangesAsync(cancellationToken);

        if (transaction is not null)
        {
            await transaction.CommitAsync(cancellationToken);
        }
    }

    public async Task RefundAsync(
        Guid workspaceId,
        Guid aiJobId,
        string usageType,
        CancellationToken cancellationToken = default)
    {
        if (!options.Value.EnforceCredits)
        {
            return;
        }

        await using var transaction = db.Database.IsRelational()
            ? await db.Database.BeginTransactionAsync(
                System.Data.IsolationLevel.ReadCommitted,
                cancellationToken)
            : null;

        await LockWorkspaceAsync(workspaceId, cancellationToken);

        var refundPrefix = $"refund:{aiJobId:N}";
        if (await db.CreditLedgerEntries.AnyAsync(
                entry => entry.IdempotencyKey.StartsWith(refundPrefix),
                cancellationToken))
        {
            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return;
        }

        var debitEntries = await db.CreditLedgerEntries
            .Where(entry => entry.WorkspaceId == workspaceId
                && entry.AiJobId == aiJobId
                && entry.EntryType == CreditEntryType.Debit)
            .ToListAsync(cancellationToken);

        if (debitEntries.Count == 0)
        {
            if (transaction is not null)
            {
                await transaction.CommitAsync(cancellationToken);
            }

            return;
        }

        var subscription = await EnsureActiveSubscriptionAsync(workspaceId, cancellationToken);
        var now = DateTimeOffset.UtcNow;

        foreach (var debit in debitEntries)
        {
            var refundedCredits = -debit.Credits;
            if (debit.Bucket == CreditBucket.Recurring)
            {
                subscription.RecurringCreditsRemaining += refundedCredits;
            }
            else
            {
                subscription.TopUpCreditsRemaining += refundedCredits;
            }

            db.CreditLedgerEntries.Add(CreateLedgerEntry(
                subscription,
                aiJobId,
                debit.Bucket,
                refundedCredits,
                usageType,
                $"{refundPrefix}:{debit.Bucket.ToString().ToLowerInvariant()}",
                CreditEntryType.Refund,
                now));
        }

        subscription.UpdatedAt = now;
        await db.SaveChangesAsync(cancellationToken);

        if (transaction is not null)
        {
            await transaction.CommitAsync(cancellationToken);
        }
    }

    public async Task<WorkspaceSubscription> EnsureActiveSubscriptionAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        var subscription = await db.WorkspaceSubscriptions
            .Include(candidate => candidate.Plan)
            .FirstOrDefaultAsync(
                candidate => candidate.WorkspaceId == workspaceId,
                cancellationToken);
        var now = DateTimeOffset.UtcNow;

        if (subscription is not null && subscription.CurrentPeriodEnd > now)
        {
            return subscription;
        }

        var freePlan = await db.SubscriptionPlans.FirstOrDefaultAsync(
            plan => plan.Code == "free" && plan.IsActive,
            cancellationToken)
            ?? throw new InvalidOperationException("The free subscription plan is not configured.");

        if (subscription is null)
        {
            subscription = new WorkspaceSubscription
            {
                Id = Guid.NewGuid(),
                WorkspaceId = workspaceId,
                PlanId = freePlan.Id,
                Plan = freePlan,
                Status = SubscriptionStatus.Active,
                RecurringCreditsRemaining = freePlan.IncludedCredits,
                CurrentPeriodStart = now,
                CurrentPeriodEnd = now.AddMonths(freePlan.BillingPeriodMonths),
                CreatedAt = now,
                UpdatedAt = now
            };
            db.WorkspaceSubscriptions.Add(subscription);
        }
        else
        {
            subscription.PlanId = freePlan.Id;
            subscription.Plan = freePlan;
            subscription.Status = SubscriptionStatus.Active;
            subscription.RecurringCreditsRemaining = freePlan.IncludedCredits;
            subscription.CurrentPeriodStart = now;
            subscription.CurrentPeriodEnd = now.AddMonths(freePlan.BillingPeriodMonths);
            subscription.CancelAtPeriodEnd = false;
            subscription.UpdatedAt = now;
        }

        await db.SaveChangesAsync(cancellationToken);
        return subscription;
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

    private static CreditLedgerEntry CreateLedgerEntry(
        WorkspaceSubscription subscription,
        Guid aiJobId,
        CreditBucket bucket,
        int credits,
        string usageType,
        string idempotencyKey,
        CreditEntryType entryType,
        DateTimeOffset now)
    {
        return new CreditLedgerEntry
        {
            Id = Guid.NewGuid(),
            WorkspaceSubscriptionId = subscription.Id,
            WorkspaceId = subscription.WorkspaceId,
            AiJobId = aiJobId,
            EntryType = entryType,
            Bucket = bucket,
            Credits = credits,
            UsageType = usageType,
            IdempotencyKey = idempotencyKey,
            CreatedAt = now
        };
    }
}
