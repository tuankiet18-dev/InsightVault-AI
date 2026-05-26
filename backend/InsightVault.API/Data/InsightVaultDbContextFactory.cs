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
            .AddJsonFile("backend/InsightVault.API/appsettings.json", optional: true)
            .AddJsonFile("backend/InsightVault.API/appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__Postgres")
            ?? configuration.GetConnectionString("Postgres")
            ?? "Host=localhost;Port=5433;Database=insightvault;Username=admin;Password=password123";

        optionsBuilder
            .UseNpgsql(connectionString, npgsql => npgsql.UseVector())
            .UseSnakeCaseNamingConvention();

        return new InsightVaultDbContext(optionsBuilder.Options);
    }
}
