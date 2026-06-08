using InsightVault.API.Application.Abstractions.Services.AiJobs;
using InsightVault.API.Application.Abstractions.Services.Documents;
using InsightVault.API.Application.Abstractions.Services.Folders;
using InsightVault.API.Application.Abstractions.Services.Reports;
using InsightVault.API.Application.Services.AiJobs;
using InsightVault.API.Application.Services.Documents;
using InsightVault.API.Application.Services.Folders;
using InsightVault.API.Application.Services.Reports;

namespace InsightVault.API.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IAiJobService, AiJobService>();
        services.AddScoped<IFolderService, FolderService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IReportService, ReportService>();

        return services;
    }
}
