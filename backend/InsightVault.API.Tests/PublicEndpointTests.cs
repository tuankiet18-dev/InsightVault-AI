using System.Net;
using System.Text.Json;

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

    [Fact]
    public async Task PayOs_return_rejects_missing_order_code()
    {
        using var client = factory.CreateClient();

        var response = await client.GetAsync(
            "/api/billing/payos/return?status=PAID");
        var body = JsonDocument.Parse(await response.Content.ReadAsStringAsync());

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(body.RootElement.GetProperty("successful").GetBoolean());
        Assert.Equal(
            "invaliddata",
            body.RootElement.GetProperty("status").GetString());
    }
}
