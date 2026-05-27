using InsightVault.API.Data;
using InsightVault.API.Infrastructure;
using Microsoft.EntityFrameworkCore;
using Pgvector.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddControllers();
builder.Services.AddDbContext<InsightVaultDbContext>(options =>
    options
        .UseNpgsql(builder.Configuration.GetConnectionString("Postgres"), npgsql => npgsql.UseVector())
        .UseSnakeCaseNamingConvention());
builder.Services.AddInfrastructureServices();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.MapControllers();

app.Run();
