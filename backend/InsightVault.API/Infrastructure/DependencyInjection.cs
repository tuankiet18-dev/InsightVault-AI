using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Abstractions.Services.Workspaces;
using InsightVault.API.Application.Services.Auth;
using InsightVault.API.Application.Services.Workspaces;
using InsightVault.API.Application.Abstractions.Ai;
using InsightVault.API.Application.Abstractions.Messaging;
using InsightVault.API.Application.Abstractions.Storage;
using InsightVault.API.Infrastructure.Ai;
using InsightVault.API.Infrastructure.Auth;
using InsightVault.API.Infrastructure.BackgroundJobs;
using InsightVault.API.Infrastructure.Messaging;
using InsightVault.API.Infrastructure.Persistence.Repositories;
using InsightVault.API.Infrastructure.Storage;
using InsightVault.API.Application.Abstractions.Services.Emails;
using InsightVault.API.Application.Abstractions.Services.Invitations;
using InsightVault.API.Application.Services.Invitations;
using InsightVault.API.Infrastructure.Emails;

namespace InsightVault.API.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddOptions<ObjectStorageOptions>()
            .Bind(configuration.GetSection("MinIO"))
            .Validate(options => !string.IsNullOrWhiteSpace(options.Endpoint), "MinIO:Endpoint is required.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.AccessKey), "MinIO:AccessKey is required.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.SecretKey), "MinIO:SecretKey is required.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.BucketName), "MinIO:BucketName is required.")
            .Validate(options => options.PresignedUploadMinutes > 0, "MinIO:PresignedUploadMinutes must be greater than zero.")
            .ValidateOnStart();
        services.AddOptions<RabbitMqOptions>()
            .Bind(configuration.GetSection("RabbitMQ"))
            .Validate(options => !string.IsNullOrWhiteSpace(options.Host), "RabbitMQ:Host is required.")
            .Validate(options => options.Port > 0, "RabbitMQ:Port must be greater than zero.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.Username), "RabbitMQ:Username is required.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.Password), "RabbitMQ:Password is required.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.DocumentProcessingQueue), "RabbitMQ:DocumentProcessingQueue is required.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.AiJobsQueue), "RabbitMQ:AiJobsQueue is required.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.EmailQueue), "RabbitMQ:EmailQueue is required.")
            .ValidateOnStart();
        services.AddOptions<SmtpOptions>()
            .Bind(configuration.GetSection("Smtp"))
            .Validate(options => !string.IsNullOrWhiteSpace(options.Host), "Smtp:Host is required.")
            .Validate(options => options.Port > 0, "Smtp:Port must be greater than zero.")
            .Validate(options => !string.IsNullOrWhiteSpace(options.SenderEmail), "Smtp:SenderEmail is required.")
            .ValidateOnStart();
        services.AddOptions<AiServiceOptions>()
            .Bind(configuration.GetSection("AIService"))
            .Validate(options => Uri.TryCreate(options.BaseUrl, UriKind.Absolute, out _), "AIService:BaseUrl must be an absolute URI.")
            .ValidateOnStart();
        services.AddOptions<TrashCleanupOptions>()
            .Bind(configuration.GetSection("TrashCleanup"))
            .Validate(options => options.DocumentRetentionDays > 0, "TrashCleanup:DocumentRetentionDays must be greater than zero.")
            .Validate(options => options.IntervalHours > 0, "TrashCleanup:IntervalHours must be greater than zero.")
            .Validate(options => options.BatchSize is > 0 and <= 500, "TrashCleanup:BatchSize must be between 1 and 500.")
            .ValidateOnStart();
        services.AddOptions<WorkspaceInvitationOptions>()
            .Bind(configuration.GetSection("WorkspaceInvitation"))
            .Validate(options => Uri.TryCreate(options.FrontendBaseUrl, UriKind.Absolute, out _), "WorkspaceInvitation:FrontendBaseUrl must be an absolute URI.")
            .Validate(options => options.ExpiresDays > 0, "WorkspaceInvitation:ExpiresDays must be greater than zero.")
            .ValidateOnStart();
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
        services.AddHostedService<AiJobWorker>();
        services.AddHostedService<TrashCleanupWorker>();
        services.AddHostedService<EmailWorker>();

        // Repositories
        services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IWorkspaceRepository, WorkspaceRepository>();
        services.AddScoped<IWorkspaceInvitationRepository, WorkspaceInvitationRepository>();
        services.AddScoped<IFolderRepository, FolderRepository>();
        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<IAiJobRepository, AiJobRepository>();
        services.AddScoped<IReportRepository, ReportRepository>();

        // Auth services
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<IGoogleTokenVerifier, GoogleTokenVerifier>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        // Workspace services
        services.AddScoped<IWorkspacePermissionService, InsightVault.API.Application.Services.Workspaces.WorkspacePermissionService>();
        services.AddScoped<IWorkspaceService, WorkspaceService>();
        services.AddScoped<IWorkspaceInvitationService, WorkspaceInvitationService>();

        // Email services
        services.AddScoped<IEmailService, MessagingEmailService>();

        return services;
    }
}
