using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using Pgvector.EntityFrameworkCore;

namespace InsightVault.API.Data;

public sealed class InsightVaultDbContextFactory : IDesignTimeDbContextFactory<InsightVaultDbContext>
{
    public InsightVaultDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<InsightVaultDbContext>();
        var configuration = new ConfigurationBuilder()
            .SetBasePath(Directory.GetCurrentDirectory())
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException(
                "Connection string 'Postgres' is required. Set ConnectionStrings__Postgres or create appsettings.Development.json from the example file.");

        optionsBuilder
            .UseNpgsql(connectionString, npgsql => npgsql.UseVector())
            .UseSnakeCaseNamingConvention();

        return new InsightVaultDbContext(optionsBuilder.Options);
    }
}
