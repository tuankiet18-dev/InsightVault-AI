using System.Net;

namespace InsightVault.API.Tests;

public sealed class PublicEndpointTests(InsightVaultApiFactory factory)
    : IClassFixture<InsightVaultApiFactory>
{
    [Theory]
    [InlineData("/health/live")]
    [InlineData("/api/health")]
    [InlineData("/api/meta")]
    public async Task Public_health_and_meta_endpoints_return_success(string path)
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync(path);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
