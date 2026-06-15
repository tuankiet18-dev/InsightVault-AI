using InsightVault.API.Application.Abstractions.Services.Admin;
using InsightVault.API.Application.Abstractions.Services.AiJobs;
using InsightVault.API.Application.Abstractions.Services.Chat;
using InsightVault.API.Application.Abstractions.Services.Dashboard;
using InsightVault.API.Application.Abstractions.Services.Billing;
using InsightVault.API.Application.Abstractions.Services.Documents;
using InsightVault.API.Application.Abstractions.Services.Folders;
using InsightVault.API.Application.Abstractions.Services.Reports;
using InsightVault.API.Application.Services.Admin;
using InsightVault.API.Application.Services.AiJobs;
using InsightVault.API.Application.Services.Chat;
using InsightVault.API.Application.Services.Dashboard;
using InsightVault.API.Application.Services.Billing;
using InsightVault.API.Application.Services.Documents;
using InsightVault.API.Application.Services.Folders;
using InsightVault.API.Application.Services.Reports;

namespace InsightVault.API.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<IAiJobService, AiJobService>();
        services.AddScoped<IChatService, ChatService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IBillingService, BillingService>();
        services.AddScoped<ICreditService, CreditService>();
        services.AddScoped<IWorkspaceEntitlementService, WorkspaceEntitlementService>();
        services.AddScoped<IFolderService, FolderService>();
        services.AddScoped<IDocumentService, DocumentService>();
        services.AddScoped<IReportService, ReportService>();

        return services;
    }
}
