using InsightVault.API.Application.Abstractions.Auth;
using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Infrastructure.Auth;
using InsightVault.API.Infrastructure.Persistence.Repositories;

namespace InsightVault.API.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        services.AddScoped(typeof(IRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IWorkspaceRepository, WorkspaceRepository>();
        services.AddScoped<IFolderRepository, FolderRepository>();
        services.AddScoped<IDocumentRepository, DocumentRepository>();
        services.AddScoped<IAiJobRepository, AiJobRepository>();
        services.AddScoped<IReportRepository, ReportRepository>();

        return services;
    }
}
