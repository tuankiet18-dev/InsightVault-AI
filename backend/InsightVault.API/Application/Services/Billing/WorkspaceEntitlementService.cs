using InsightVault.API.Application.Abstractions.Services.Billing;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Application.Services.Billing;

public sealed class WorkspaceEntitlementService(
    InsightVaultDbContext db,
    ICreditService creditService) : IWorkspaceEntitlementService
{
    public async Task EnsureCanAddMemberAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        var workspace = await db.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == workspaceId, cancellationToken)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "workspace.not_found", "Workspace not found.");

        var subscription = await creditService.EnsureActiveSubscriptionAsync(
            workspace.OwnerId,
            cancellationToken);
        var currentMembers = await db.WorkspaceMembers.CountAsync(
            member => member.WorkspaceId == workspaceId
                && member.RemovedAt == null
                && (member.Status == MemberStatus.Active || member.Status == MemberStatus.Invited),
            cancellationToken);

        if (currentMembers >= subscription.Plan.MaxMembers)
        {
            throw new ApiException(
                StatusCodes.Status402PaymentRequired,
                "billing.member_limit_reached",
                "The workspace member limit has been reached.",
                new
                {
                    currentMembers,
                    maxMembers = subscription.Plan.MaxMembers,
                    planCode = subscription.Plan.Code
                });
        }
    }

    public async Task EnsureCanStoreAsync(
        Guid workspaceId,
        long additionalBytes,
        CancellationToken cancellationToken = default)
    {
        var workspace = await db.Workspaces
            .AsNoTracking()
            .FirstOrDefaultAsync(w => w.Id == workspaceId, cancellationToken)
            ?? throw new ApiException(StatusCodes.Status404NotFound, "workspace.not_found", "Workspace not found.");

        var subscription = await creditService.EnsureActiveSubscriptionAsync(
            workspace.OwnerId,
            cancellationToken);
        var usedBytes = await db.Documents
            .Where(document => document.WorkspaceId == workspaceId)
            .SumAsync(document => (long?)document.FileSizeBytes, cancellationToken)
            ?? 0;

        if (usedBytes + additionalBytes > subscription.Plan.StorageLimitBytes)
        {
            throw new ApiException(
                StatusCodes.Status402PaymentRequired,
                "billing.storage_limit_reached",
                "The workspace storage limit would be exceeded.",
                new
                {
                    usedBytes,
                    requestedBytes = additionalBytes,
                    storageLimitBytes = subscription.Plan.StorageLimitBytes,
                    planCode = subscription.Plan.Code
                });
        }
    }
}
