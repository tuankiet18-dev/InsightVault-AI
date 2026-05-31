using InsightVault.API.Application;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.DTOs.Common;
using InsightVault.API.Infrastructure;
using InsightVault.API.Infrastructure.Auth;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Pgvector.EntityFrameworkCore;
using System.Text;
using System.Text.Json;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);
const string CorsPolicyName = "Frontend";

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

builder.Services.AddOpenApi();
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var errors = context.ModelState
                .Where(entry => entry.Value?.Errors.Count > 0)
                .ToDictionary(
                    entry => entry.Key,
                    entry => entry.Value?.Errors.Select(error => error.ErrorMessage).ToArray() ?? []);

            return new BadRequestObjectResult(new ApiErrorDto(
                "request.validation_failed",
                "Request validation failed.",
                errors));
        };
    });
builder.Services.AddApplicationServices();
builder.Services.AddHttpContextAccessor();
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<GoogleAuthOptions>(builder.Configuration.GetSection("GoogleAuth"));
builder.Services.AddDbContext<InsightVaultDbContext>(options =>
    options
        .UseNpgsql(builder.Configuration.GetConnectionString("Postgres"), npgsql => npgsql.UseVector())
        .UseSnakeCaseNamingConvention());
builder.Services.AddCors(options =>
{
    options.AddPolicy(CorsPolicyName, policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? [];

        if (origins.Length > 0)
        {
            policy.WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    });
});
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var jwtOptions = builder.Configuration.GetSection("Jwt").Get<JwtOptions>() ?? new JwtOptions();
        var signingKey = Encoding.UTF8.GetBytes(jwtOptions.SigningKey);

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtOptions.Issuer,
            ValidAudience = jwtOptions.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(signingKey),
            ClockSkew = TimeSpan.FromMinutes(1)
        };

        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";

                var error = new ApiErrorDto("auth.unauthorized", "Authentication is required.");
                await context.Response.WriteAsync(JsonSerializer.Serialize(
                    error,
                    new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
            },
            OnForbidden = async context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";

                var error = new ApiErrorDto("auth.forbidden", "You do not have permission to access this resource.");
                await context.Response.WriteAsync(JsonSerializer.Serialize(
                    error,
                    new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
            }
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddInfrastructureServices(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference();
}

app.UseMiddleware<ApiExceptionMiddleware>();
app.UseHttpsRedirection();
app.UseCors(CorsPolicyName);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
