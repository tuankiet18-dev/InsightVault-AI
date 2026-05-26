using InsightVault.API.Data;
using Microsoft.EntityFrameworkCore;
using Pgvector.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddDbContext<InsightVaultDbContext>(options =>
    options
        .UseNpgsql(builder.Configuration.GetConnectionString("Postgres"), npgsql => npgsql.UseVector())
        .UseSnakeCaseNamingConvention());

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

var api = app.MapGroup("/api");

api.MapGet("/health", () => Results.Ok(new HealthResponse("ok", "InsightVault API is running")))
    .WithName("GetHealth");

api.MapGet("/health/db", async (InsightVaultDbContext db, CancellationToken cancellationToken) =>
    await db.Database.CanConnectAsync(cancellationToken)
        ? Results.Ok(new HealthResponse("ok", "Database connection is healthy"))
        : Results.Problem("Database connection failed"))
    .WithName("GetDatabaseHealth");

api.MapGet("/meta", () => Results.Ok(new ProjectMetaResponse(
    "InsightVault AI",
    "Collaborative AI-powered knowledge workspace",
    new[]
    {
        "Google OAuth",
        "Workspace member roles",
        "Document upload",
        "AI processing jobs",
        "RAG chat",
        "Document comparison",
        "Markdown reports",
        "Admin monitoring"
    })))
    .WithName("GetProjectMeta");

app.Run();

record HealthResponse(string Status, string Message);

record ProjectMetaResponse(string Name, string Description, string[] MvpCapabilities);
