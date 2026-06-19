using InsightVault.API.Application.Abstractions.Services.SystemSettings;
using InsightVault.API.Data;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Application.Services.SystemSettings;

public sealed class SystemSettingReader(
    InsightVaultDbContext db,
    IMemoryCache cache) : ISystemSettingReader
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    public async Task<string> GetStringAsync(
        string key,
        string fallback,
        CancellationToken cancellationToken = default)
    {
        var cacheKey = BuildCacheKey(key);
        if (cache.TryGetValue(cacheKey, out string? cachedValue))
        {
            return string.IsNullOrWhiteSpace(cachedValue) ? fallback : cachedValue;
        }

        var value = await db.SystemSettings
            .AsNoTracking()
            .Where(setting => setting.Key == key)
            .Select(setting => setting.Value)
            .FirstOrDefaultAsync(cancellationToken);

        var normalizedValue = string.IsNullOrWhiteSpace(value)
            ? fallback
            : value.Trim();

        cache.Set(cacheKey, normalizedValue, CacheDuration);
        return normalizedValue;
    }

    public async Task<bool> GetBoolAsync(
        string key,
        bool fallback,
        CancellationToken cancellationToken = default)
    {
        var value = await GetStringAsync(key, fallback.ToString(), cancellationToken);

        return bool.TryParse(value, out var parsed)
            ? parsed
            : fallback;
    }

    public void Invalidate(string key)
    {
        cache.Remove(BuildCacheKey(key));
    }

    private static string BuildCacheKey(string key)
    {
        return $"system_setting:{key}";
    }
}
