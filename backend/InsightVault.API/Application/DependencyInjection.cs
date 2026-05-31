using InsightVault.API.Application.Abstractions.Auth;
<<<<<<< HEAD
using InsightVault.API.Application.Abstractions.Services.Folders;
using InsightVault.API.Application.Services.Auth;
=======
using InsightVault.API.Application.Abstractions.Services.Documents;
using InsightVault.API.Application.Abstractions.Services.Folders;
using InsightVault.API.Application.Services.Auth;
using InsightVault.API.Application.Services.Documents;
>>>>>>> f07e3099f33f1c4031dd5f119fd1f7345fb5b495
using InsightVault.API.Application.Services.Folders;

namespace InsightVault.API.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IWorkspacePermissionService, WorkspacePermissionService>();
        services.AddScoped<IFolderService, FolderService>();
<<<<<<< HEAD
=======
        services.AddScoped<IDocumentService, DocumentService>();
>>>>>>> f07e3099f33f1c4031dd5f119fd1f7345fb5b495

        return services;
    }
}
