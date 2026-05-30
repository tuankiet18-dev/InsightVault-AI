using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Abstractions.Services.Workspaces;
using InsightVault.API.Application.Services.Auth;
using InsightVault.API.Application.Services.Workspaces;
using InsightVault.API.Infrastructure.Auth;
using InsightVault.API.Infrastructure.Persistence.Repositories;

namespace InsightVault.API.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        // Repositories
        services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IWorkspaceRepository, WorkspaceRepository>();
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
        services.AddScoped<IWorkspacePermissionService, WorkspacePermissionService>();
        services.AddScoped<IWorkspaceService, WorkspaceService>();

        return services;
    }
}
