using InsightVault.API.Application.Abstractions.Services.Documents;
using InsightVault.API.Application.Abstractions.Services.Folders;
using InsightVault.API.Application.Services.Documents;
using InsightVault.API.Application.Services.Folders;

namespace InsightVault.API.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IFolderService, FolderService>();
        services.AddScoped<IDocumentService, DocumentService>();

        return services;
    }
}
