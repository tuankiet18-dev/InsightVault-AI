using InsightVault.API.Application.Abstractions.Payments;
using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Abstractions.Services.Billing;
using InsightVault.API.Application.Abstractions.Services.Workspaces;
using InsightVault.API.Application.Services.Billing;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.Infrastructure.Payments;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace InsightVault.API.Tests;

[Trait("Category", "PostgresIntegration")]
public sealed class BillingPostgresIntegrationTests
{
    private const string ConnectionStringEnvironmentVariable =
        "INSIGHTVAULT_TEST_POSTGRES";

    [Fact]
    public async Task Concurrent_consumption_debits_every_job_exactly_once()
    {
        var connectionString = GetConnectionString();
        if (connectionString is null)
        {
            return;
        }

        var fixture = await CreateFixtureAsync(
            connectionString,
            recurringCredits: 100,
            topUpCredits: 0,
            jobCount: 50);

        try
        {
            await Task.WhenAll(fixture.JobIds.Select(async jobId =>
            {
                await using var db = CreateDbContext(connectionString);
                var service = CreateCreditService(db);
                await service.ConsumeAsync(
                    fixture.WorkspaceId,
                    jobId,
                    1,
                    "concurrency_test");
            }));

            await using var verificationDb = CreateDbContext(connectionString);
            var subscription = await verificationDb.WorkspaceSubscriptions
                .AsNoTracking()
                .SingleAsync(candidate => candidate.WorkspaceId == fixture.WorkspaceId);
            var debitCount = await verificationDb.CreditLedgerEntries.CountAsync(
                entry => entry.WorkspaceId == fixture.WorkspaceId
                    && entry.EntryType == CreditEntryType.Debit);

            Assert.Equal(50, subscription.RecurringCreditsRemaining);
            Assert.Equal(50, debitCount);
        }
        finally
        {
            await DeleteFixtureAsync(connectionString, fixture);
        }
    }

    [Fact]
    public async Task Ledger_failure_rolls_back_credit_balance()
    {
        var connectionString = GetConnectionString();
        if (connectionString is null)
        {
            return;
        }

        var fixture = await CreateFixtureAsync(
            connectionString,
            recurringCredits: 10,
            topUpCredits: 0,
            jobCount: 1);

        try
        {
            await using (var db = CreateDbContext(connectionString))
            {
                var service = CreateCreditService(db);
                await Assert.ThrowsAsync<DbUpdateException>(() =>
                    service.ConsumeAsync(
                        fixture.WorkspaceId,
                        fixture.JobIds.Single(),
                        1,
                        new string('x', 101)));
            }

            await using var verificationDb = CreateDbContext(connectionString);
            var subscription = await verificationDb.WorkspaceSubscriptions
                .AsNoTracking()
                .SingleAsync(candidate => candidate.WorkspaceId == fixture.WorkspaceId);
            var ledgerCount = await verificationDb.CreditLedgerEntries.CountAsync(
                entry => entry.WorkspaceId == fixture.WorkspaceId);

            Assert.Equal(10, subscription.RecurringCreditsRemaining);
            Assert.Equal(0, ledgerCount);
        }
        finally
        {
            await DeleteFixtureAsync(connectionString, fixture);
        }
    }

    [Fact]
    public async Task Concurrent_webhook_replay_grants_topup_once()
    {
        var connectionString = GetConnectionString();
        if (connectionString is null)
        {
            return;
        }

        var fixture = await CreateFixtureAsync(
            connectionString,
            recurringCredits: 10,
            topUpCredits: 0,
            jobCount: 0);
        var orderCode = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
        var orderId = Guid.NewGuid();
        var packageId = Guid.Parse("20000000-0000-0000-0000-000000000001");

        try
        {
            await using (var seedDb = CreateDbContext(connectionString))
            {
                seedDb.PaymentOrders.Add(new PaymentOrder
                {
                    Id = orderId,
                    WorkspaceId = fixture.WorkspaceId,
                    CreatedById = fixture.UserId,
                    CreditPackageId = packageId,
                    PurchaseType = PaymentPurchaseType.CreditTopUp,
                    Status = PaymentOrderStatus.Pending,
                    Provider = "vnpay",
                    ProviderOrderCode = orderCode,
                    AmountVnd = 39_000,
                    CreatedAt = DateTimeOffset.UtcNow,
                    UpdatedAt = DateTimeOffset.UtcNow
                });
                await seedDb.SaveChangesAsync();
            }

            var gateway = new StubPaymentGateway(
                new VerifiedPayment(
                    orderCode,
                    39_000,
                    $"test-payment-link-{orderId:N}",
                    $"test-reference-{orderId:N}",
                    true,
                    true));

            var results = await Task.WhenAll(Enumerable.Range(0, 2).Select(async _ =>
            {
                await using var db = CreateDbContext(connectionString);
                var service = new BillingService(
                    db,
                    new StubCurrentUserService(),
                    new StubWorkspacePermissionService(),
                    CreateCreditService(db),
                    gateway,
                    Options.Create(new VnPayOptions { Enabled = true }));

                return await service.HandlePaymentNotificationAsync(
                    new Dictionary<string, string>());
            }));

            await using var verificationDb = CreateDbContext(connectionString);
            var subscription = await verificationDb.WorkspaceSubscriptions
                .AsNoTracking()
                .SingleAsync(candidate => candidate.WorkspaceId == fixture.WorkspaceId);
            var grantCount = await verificationDb.CreditLedgerEntries.CountAsync(
                entry => entry.PaymentOrderId == orderId
                    && entry.EntryType == CreditEntryType.Grant);

            Assert.Single(results, outcome => outcome == PaymentNotificationOutcome.Applied);
            Assert.Single(results, outcome => outcome == PaymentNotificationOutcome.AlreadyProcessed);
            Assert.Equal(500, subscription.TopUpCreditsRemaining);
            Assert.Equal(1, grantCount);
        }
        finally
        {
            await DeleteFixtureAsync(connectionString, fixture);
        }
    }

    private static string? GetConnectionString()
    {
        return Environment.GetEnvironmentVariable(ConnectionStringEnvironmentVariable);
    }

    private static InsightVaultDbContext CreateDbContext(string connectionString)
    {
        var options = new DbContextOptionsBuilder<InsightVaultDbContext>()
            .UseNpgsql(connectionString, npgsql => npgsql.UseVector())
            .UseSnakeCaseNamingConvention()
            .Options;

        return new InsightVaultDbContext(options);
    }

    private static CreditService CreateCreditService(InsightVaultDbContext db)
    {
        return new CreditService(
            db,
            Options.Create(new BillingOptions { EnforceCredits = true }));
    }

    private static async Task<BillingFixture> CreateFixtureAsync(
        string connectionString,
        int recurringCredits,
        int topUpCredits,
        int jobCount)
    {
        await using var db = CreateDbContext(connectionString);
        var now = DateTimeOffset.UtcNow;
        var userId = Guid.NewGuid();
        var workspaceId = Guid.NewGuid();
        var subscriptionId = Guid.NewGuid();
        var jobIds = Enumerable.Range(0, jobCount)
            .Select(_ => Guid.NewGuid())
            .ToArray();
        var freePlanId = Guid.Parse("10000000-0000-0000-0000-000000000001");

        db.Users.Add(new User
        {
            Id = userId,
            GoogleId = $"billing-test-{userId:N}",
            Email = $"billing-test-{userId:N}@example.com",
            FullName = "Billing Integration Test",
            CreatedAt = now,
            UpdatedAt = now
        });
        db.Workspaces.Add(new Workspace
        {
            Id = workspaceId,
            OwnerId = userId,
            Name = $"Billing test {workspaceId:N}",
            CreatedAt = now,
            UpdatedAt = now
        });
        db.WorkspaceSubscriptions.Add(new WorkspaceSubscription
        {
            Id = subscriptionId,
            WorkspaceId = workspaceId,
            PlanId = freePlanId,
            Status = SubscriptionStatus.Active,
            RecurringCreditsRemaining = recurringCredits,
            TopUpCreditsRemaining = topUpCredits,
            CurrentPeriodStart = now,
            CurrentPeriodEnd = now.AddMonths(1),
            CreatedAt = now,
            UpdatedAt = now
        });
        db.AiJobs.AddRange(jobIds.Select(jobId => new AiJob
        {
            Id = jobId,
            WorkspaceId = workspaceId,
            CreatedById = userId,
            JobType = AiJobType.ProcessDocument,
            Status = AiJobStatus.Queued,
            CreatedAt = now,
            UpdatedAt = now
        }));

        await db.SaveChangesAsync();
        return new BillingFixture(userId, workspaceId, jobIds);
    }

    private static async Task DeleteFixtureAsync(
        string connectionString,
        BillingFixture fixture)
    {
        await using var db = CreateDbContext(connectionString);
        await db.CreditLedgerEntries
            .Where(entry => entry.WorkspaceId == fixture.WorkspaceId)
            .ExecuteDeleteAsync();

        var workspace = await db.Workspaces.SingleOrDefaultAsync(
            candidate => candidate.Id == fixture.WorkspaceId);
        if (workspace is not null)
        {
            db.Workspaces.Remove(workspace);
            await db.SaveChangesAsync();
        }

        var user = await db.Users.SingleOrDefaultAsync(
            candidate => candidate.Id == fixture.UserId);
        if (user is not null)
        {
            db.Users.Remove(user);
            await db.SaveChangesAsync();
        }
    }

    private sealed record BillingFixture(
        Guid UserId,
        Guid WorkspaceId,
        IReadOnlyList<Guid> JobIds);

    private sealed class StubPaymentGateway(VerifiedPayment payment) : IPaymentGateway
    {
        public string ProviderName => "vnpay";

        public Task<PaymentCheckoutResult> CreateCheckoutAsync(
            PaymentCheckoutRequest request,
            CancellationToken cancellationToken = default)
        {
            throw new NotSupportedException();
        }

        public Task<VerifiedPayment> VerifyNotificationAsync(
            IReadOnlyDictionary<string, string> parameters,
            CancellationToken cancellationToken = default)
        {
            return Task.FromResult(payment);
        }
    }

    private sealed class StubCurrentUserService : ICurrentUserService
    {
        public Guid? UserId => null;
        public string? Email => null;
        public bool IsAuthenticated => false;
    }

    private sealed class StubWorkspacePermissionService : IWorkspacePermissionService
    {
        public Task<WorkspaceRole?> GetUserRoleAsync(
            Guid workspaceId,
            Guid userId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<WorkspaceRole?>(null);

        public Task<bool> IsActiveMemberAsync(
            Guid workspaceId,
            Guid userId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(false);

        public Task EnsureCanReadWorkspaceAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task EnsureCanViewWorkspaceAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task EnsureCanManageWorkspaceAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task EnsureCanManageMembersAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task EnsureCanMutateWorkspaceContentAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task EnsureCanManageFoldersAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task EnsureCanManageDocumentsAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task EnsureCanDeleteDocumentAsync(Guid workspaceId, Guid? uploadedById, Guid userId, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
