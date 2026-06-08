using InsightVault.API.Application.Abstractions.Storage;
using InsightVault.API.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace InsightVault.API.Infrastructure.BackgroundJobs;

public sealed class TrashCleanupWorker(
    IServiceScopeFactory scopeFactory,
    IOptions<TrashCleanupOptions> options,
    ILogger<TrashCleanupWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var cleanupOptions = options.Value;
        if (!cleanupOptions.Enabled)
        {
            logger.LogInformation("Trash cleanup worker is disabled");
            return;
        }

        var interval = TimeSpan.FromHours(Math.Max(1, cleanupOptions.IntervalHours));
        using var timer = new PeriodicTimer(interval);

        await CleanupExpiredDocumentsAsync(stoppingToken);

        try
        {
            while (await timer.WaitForNextTickAsync(stoppingToken))
            {
                await CleanupExpiredDocumentsAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
        }
    }

    private async Task CleanupExpiredDocumentsAsync(CancellationToken cancellationToken)
    {
        var cleanupOptions = options.Value;
        var retentionDays = Math.Max(1, cleanupOptions.DocumentRetentionDays);
        var batchSize = Math.Clamp(cleanupOptions.BatchSize, 1, 500);
        var cutoff = DateTimeOffset.UtcNow.AddDays(-retentionDays);

        try
        {
            using var scope = scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<InsightVaultDbContext>();
            var objectStorage = scope.ServiceProvider.GetRequiredService<IObjectStorageService>();

            var expiredDocuments = await db.Documents
                .Where(document => document.DeletedAt != null && document.DeletedAt <= cutoff)
                .OrderBy(document => document.DeletedAt)
                .Take(batchSize)
                .ToListAsync(cancellationToken);

            if (expiredDocuments.Count == 0)
            {
                return;
            }

            foreach (var document in expiredDocuments)
            {
                await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
                db.Documents.Remove(document);
                await objectStorage.DeleteObjectAsync(
                    document.MinioBucket,
                    document.MinioObjectKey,
                    cancellationToken);
                await db.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);
            }

            logger.LogInformation(
                "Hard-deleted {DocumentCount} expired Trash documents older than {RetentionDays} days",
                expiredDocuments.Count,
                retentionDays);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Trash cleanup worker failed");
        }
    }
}
