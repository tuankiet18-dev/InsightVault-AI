namespace InsightVault.API.Infrastructure.BackgroundJobs;

public sealed class TrashCleanupOptions
{
    public bool Enabled { get; set; } = true;

    public int DocumentRetentionDays { get; set; } = 30;

    public int IntervalHours { get; set; } = 24;

    public int BatchSize { get; set; } = 50;
}
