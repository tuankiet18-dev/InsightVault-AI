using InsightVault.API.Application.Services.Billing;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Http;

namespace InsightVault.API.Tests;

public sealed class BillingCreditTests
{
    [Fact]
    public void Credit_costs_scale_with_document_and_compare_size()
    {
        var options = new BillingOptions
        {
            DocumentCreditsPerFiveMb = 1,
            CompareBaseCredits = 5,
            CompareAdditionalDocumentCredits = 2
        };

        Assert.Equal(1, BillingCreditCosts.ForDocument(1024, options));
        Assert.Equal(2, BillingCreditCosts.ForDocument(6L * 1024 * 1024, options));
        Assert.Equal(5, BillingCreditCosts.ForCompare(2, options));
        Assert.Equal(9, BillingCreditCosts.ForCompare(4, options));
    }

    [Fact]
    public async Task Consume_uses_recurring_before_topup_and_is_idempotent()
    {
        await using var db = CreateDbContext();
        var userId = Guid.NewGuid();
        var workspaceId = Guid.NewGuid();
        await SeedSubscriptionAsync(db, userId, recurringCredits: 3, topUpCredits: 5);
        var service = CreateService(db);
        var jobId = Guid.NewGuid();

        await service.ConsumeAsync(userId, workspaceId, jobId, 6, "compare_documents");
        await service.ConsumeAsync(userId, workspaceId, jobId, 6, "compare_documents");

        var subscription = await db.UserSubscriptions.SingleAsync();
        Assert.Equal(0, subscription.RecurringCreditsRemaining);
        Assert.Equal(2, subscription.TopUpCreditsRemaining);
        Assert.Equal(2, await db.CreditLedgerEntries.CountAsync());
    }

    [Fact]
    public async Task Consume_rejects_request_when_workspace_has_insufficient_credits()
    {
        await using var db = CreateDbContext();
        var userId = Guid.NewGuid();
        var workspaceId = Guid.NewGuid();
        await SeedSubscriptionAsync(db, userId, recurringCredits: 2, topUpCredits: 1);
        var service = CreateService(db);

        var exception = await Assert.ThrowsAsync<ApiException>(() =>
            service.ConsumeAsync(
                userId,
                workspaceId,
                Guid.NewGuid(),
                5,
                "generate_report"));

        Assert.Equal(StatusCodes.Status402PaymentRequired, exception.StatusCode);
        Assert.Equal("billing.insufficient_credits", exception.ErrorCode);
    }

    [Fact]
    public async Task Refund_restores_the_original_buckets_and_is_idempotent()
    {
        await using var db = CreateDbContext();
        var userId = Guid.NewGuid();
        var workspaceId = Guid.NewGuid();
        await SeedSubscriptionAsync(db, userId, recurringCredits: 2, topUpCredits: 5);
        var service = CreateService(db);
        var jobId = Guid.NewGuid();

        await service.ConsumeAsync(userId, workspaceId, jobId, 4, "generate_report");
        await service.RefundAsync(userId, workspaceId, jobId, "queue_failure");
        await service.RefundAsync(userId, workspaceId, jobId, "queue_failure");

        var subscription = await db.UserSubscriptions.SingleAsync();
        Assert.Equal(2, subscription.RecurringCreditsRemaining);
        Assert.Equal(5, subscription.TopUpCreditsRemaining);
        Assert.Equal(4, await db.CreditLedgerEntries.CountAsync());
    }

    private static InsightVaultDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<InsightVaultDbContext>()
            .UseInMemoryDatabase($"billing-tests-{Guid.NewGuid()}")
            .Options;

        return new InsightVaultDbContext(options);
    }

    private static CreditService CreateService(InsightVaultDbContext db)
    {
        return new CreditService(
            db,
            Options.Create(new BillingOptions { EnforceCredits = true }));
    }

    private static async Task SeedSubscriptionAsync(
        InsightVaultDbContext db,
        Guid userId,
        int recurringCredits,
        int topUpCredits)
    {
        var now = DateTimeOffset.UtcNow;
        var plan = new SubscriptionPlan
        {
            Id = Guid.NewGuid(),
            Code = "test",
            Name = "Test",
            Description = "Test plan",
            IncludedCredits = recurringCredits,
            BillingPeriodMonths = 1,
            MaxMembers = 5,
            StorageLimitBytes = 1024,
            CreatedAt = now,
            UpdatedAt = now
        };
        var subscription = new UserSubscription
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            PlanId = plan.Id,
            Plan = plan,
            Status = SubscriptionStatus.Active,
            RecurringCreditsRemaining = recurringCredits,
            TopUpCreditsRemaining = topUpCredits,
            CurrentPeriodStart = now,
            CurrentPeriodEnd = now.AddMonths(1),
            CreatedAt = now,
            UpdatedAt = now
        };

        db.SubscriptionPlans.Add(plan);
        db.UserSubscriptions.Add(subscription);
        await db.SaveChangesAsync();
    }
}
