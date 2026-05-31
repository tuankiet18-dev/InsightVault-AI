using InsightVault.API.Application.Abstractions.Auth;
using InsightVault.API.Application.Abstractions.Ai;
using InsightVault.API.Application.Abstractions.Messaging;
using InsightVault.API.Application.Abstractions.Repositories;
<<<<<<< HEAD
using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Services.Auth;
using InsightVault.API.Infrastructure.Auth;
=======
using InsightVault.API.Application.Abstractions.Storage;
using InsightVault.API.Infrastructure.Auth;
using InsightVault.API.Infrastructure.Ai;
using InsightVault.API.Infrastructure.BackgroundJobs;
using InsightVault.API.Infrastructure.Messaging;
>>>>>>> f07e3099f33f1c4031dd5f119fd1f7345fb5b495
using InsightVault.API.Infrastructure.Persistence.Repositories;
using InsightVault.API.Infrastructure.Storage;

namespace InsightVault.API.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.Configure<ObjectStorageOptions>(configuration.GetSection("MinIO"));
        services.Configure<RabbitMqOptions>(configuration.GetSection("RabbitMQ"));
        services.Configure<AiServiceOptions>(configuration.GetSection("AIService"));
        services.AddScoped<IObjectStorageService, ConfiguredObjectStorageService>();
        services.AddSingleton<IMessagePublisher, RabbitMqMessagePublisher>();
        services.AddHttpClient<IAiServiceClient, AiServiceClient>((serviceProvider, client) =>
        {
            var options = serviceProvider
                .GetRequiredService<Microsoft.Extensions.Options.IOptions<AiServiceOptions>>()
                .Value;

            client.BaseAddress = new Uri(options.BaseUrl);
        });
        services.AddHostedService<DocumentProcessingWorker>();

        services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IWorkspaceRepository, WorkspaceRepository>();
        services.AddScoped<IFolderRepository, FolderRepository>();
        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<IAiJobRepository, AiJobRepository>();
        services.AddScoped<IReportRepository, ReportRepository>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IGoogleTokenVerifier, GoogleTokenVerifier>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        return services;
    }
}
