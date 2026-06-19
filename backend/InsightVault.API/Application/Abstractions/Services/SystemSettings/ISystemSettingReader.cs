namespace InsightVault.API.Application.Abstractions.Services.SystemSettings;

public interface ISystemSettingReader
{
    Task<string> GetStringAsync(
        string key,
        string fallback,
        CancellationToken cancellationToken = default);

    Task<bool> GetBoolAsync(
        string key,
        bool fallback,
        CancellationToken cancellationToken = default);

    void Invalidate(string key);
}
