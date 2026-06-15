using System.Net;

namespace InsightVault.API.Tests;

public sealed class PublicEndpointTests(InsightVaultApiFactory factory)
    : IClassFixture<InsightVaultApiFactory>
{
    [Theory]
    [InlineData("/health/live")]
    [InlineData("/api/health")]
    [InlineData("/api/meta")]
    [InlineData("/api/billing/plans")]
    [InlineData("/api/billing/credit-packages")]
    public async Task Public_health_and_meta_endpoints_return_success(string path)
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync(path);
        var responseBody = await response.Content.ReadAsStringAsync();

        Assert.True(
            response.StatusCode == HttpStatusCode.OK,
            $"Expected 200 for {path}, got {(int)response.StatusCode}: {responseBody}");
    }
}
