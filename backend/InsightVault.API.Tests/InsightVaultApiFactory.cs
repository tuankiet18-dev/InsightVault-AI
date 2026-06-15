using InsightVault.API.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;

namespace InsightVault.API.Tests;

public sealed class InsightVaultApiFactory : WebApplicationFactory<Program>
{
    public InsightVaultApiFactory()
    {
        SetRequiredEnvironment("ConnectionStrings__Postgres", "Host=localhost;Database=insightvault_test;Username=test;Password=test");
        SetRequiredEnvironment("Jwt__Issuer", "InsightVault.API.Tests");
        SetRequiredEnvironment("Jwt__Audience", "InsightVault.Tests");
        SetRequiredEnvironment("Jwt__SigningKey", "test-signing-key-at-least-32-bytes-long");
        SetRequiredEnvironment("Jwt__ExpiresMinutes", "30");
        SetRequiredEnvironment("GoogleAuth__ClientId", "test-client-id.apps.googleusercontent.com");
        SetRequiredEnvironment("MinIO__Endpoint", "localhost:9000");
        SetRequiredEnvironment("MinIO__PublicEndpoint", "localhost:9000");
        SetRequiredEnvironment("MinIO__AccessKey", "test-access-key");
        SetRequiredEnvironment("MinIO__SecretKey", "test-secret-key");
        SetRequiredEnvironment("MinIO__BucketName", "test-bucket");
        SetRequiredEnvironment("MinIO__PresignedUploadMinutes", "10");
        SetRequiredEnvironment("RabbitMQ__Host", "localhost");
        SetRequiredEnvironment("RabbitMQ__Port", "5672");
        SetRequiredEnvironment("RabbitMQ__Username", "test-user");
        SetRequiredEnvironment("RabbitMQ__Password", "test-password");
        SetRequiredEnvironment("RabbitMQ__DocumentProcessingQueue", "document-processing-test");
        SetRequiredEnvironment("RabbitMQ__AiJobsQueue", "ai-jobs-test");
        SetRequiredEnvironment("RabbitMQ__EmailQueue", "emails-test");
        SetRequiredEnvironment("AIService__BaseUrl", "http://localhost:8000");
        SetRequiredEnvironment("Smtp__Enabled", "false");
        SetRequiredEnvironment("VnPay__Enabled", "false");
        SetRequiredEnvironment("TrashCleanup__Enabled", "false");
        SetRequiredEnvironment("TrashCleanup__DocumentRetentionDays", "30");
        SetRequiredEnvironment("TrashCleanup__IntervalHours", "24");
        SetRequiredEnvironment("TrashCleanup__BatchSize", "50");
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:Postgres"] = "Host=localhost;Database=insightvault_test;Username=test;Password=test",
                ["Jwt:Issuer"] = "InsightVault.API.Tests",
                ["Jwt:Audience"] = "InsightVault.Tests",
                ["Jwt:SigningKey"] = "test-signing-key-at-least-32-bytes-long",
                ["Jwt:ExpiresMinutes"] = "30",
                ["GoogleAuth:ClientId"] = "test-client-id.apps.googleusercontent.com",
                ["MinIO:Endpoint"] = "localhost:9000",
                ["MinIO:PublicEndpoint"] = "localhost:9000",
                ["MinIO:AccessKey"] = "test-access-key",
                ["MinIO:SecretKey"] = "test-secret-key",
                ["MinIO:BucketName"] = "test-bucket",
                ["MinIO:PresignedUploadMinutes"] = "10",
                ["RabbitMQ:Host"] = "localhost",
                ["RabbitMQ:Port"] = "5672",
                ["RabbitMQ:Username"] = "test-user",
                ["RabbitMQ:Password"] = "test-password",
                ["RabbitMQ:DocumentProcessingQueue"] = "document-processing-test",
                ["RabbitMQ:AiJobsQueue"] = "ai-jobs-test",
                ["RabbitMQ:EmailQueue"] = "emails-test",
                ["AIService:BaseUrl"] = "http://localhost:8000",
                ["Smtp:Enabled"] = "false",
                ["VnPay:Enabled"] = "false",
                ["TrashCleanup:Enabled"] = "false",
                ["TrashCleanup:DocumentRetentionDays"] = "30",
                ["TrashCleanup:IntervalHours"] = "24",
                ["TrashCleanup:BatchSize"] = "50"
            });
        });

        builder.ConfigureServices(services =>
        {
            services.RemoveAll<IHostedService>();
            services.RemoveAll<DbContextOptions<InsightVaultDbContext>>();
            services.RemoveAll<IDbContextOptionsConfiguration<InsightVaultDbContext>>();
            services.AddDbContext<InsightVaultDbContext>(options =>
                options.UseInMemoryDatabase($"insightvault-tests-{Guid.NewGuid()}"));
        });
    }

    private static void SetRequiredEnvironment(string key, string value)
    {
        Environment.SetEnvironmentVariable(key, value);
    }
}
