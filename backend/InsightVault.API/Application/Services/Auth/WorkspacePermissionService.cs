using InsightVault.API.Application.Abstractions.Auth;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Application.Services.Auth;

public sealed class WorkspacePermissionService(InsightVaultDbContext db) : IWorkspacePermissionService
{
    public async Task EnsureCanViewWorkspaceAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        if (!await HasRoleAsync(workspaceId, userId, [], cancellationToken))
        {
            throw new ApiException(
                StatusCodes.Status403Forbidden,
                "workspace.forbidden",
                "You do not have access to this workspace.");
        }
    }

    public async Task EnsureCanManageFoldersAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await EnsureHasOwnerOrEditorRoleAsync(
            workspaceId,
            userId,
            "workspace.insufficient_role",
            "Only workspace owners and editors can manage folders.",
            cancellationToken);
    }

    public async Task EnsureCanManageDocumentsAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await EnsureHasOwnerOrEditorRoleAsync(
            workspaceId,
            userId,
            "workspace.insufficient_role",
            "Only workspace owners and editors can manage documents.",
            cancellationToken);
    }

    private async Task EnsureHasOwnerOrEditorRoleAsync(
        Guid workspaceId,
        Guid userId,
        string errorCode,
        string message,
        CancellationToken cancellationToken)
    {
        if (!await HasRoleAsync(
                workspaceId,
                userId,
                [WorkspaceRole.Owner, WorkspaceRole.Editor],
                cancellationToken))
        {
            throw new ApiException(
                StatusCodes.Status403Forbidden,
                errorCode,
                message);
        }
    }

    private async Task<bool> HasRoleAsync(
        Guid workspaceId,
        Guid userId,
        IReadOnlyCollection<WorkspaceRole> allowedRoles,
        CancellationToken cancellationToken)
    {
        var workspace = await db.Workspaces
            .AsNoTracking()
            .Where(candidate => candidate.Id == workspaceId
                && !candidate.IsArchived
                && candidate.DeletedAt == null)
            .Select(candidate => new { candidate.OwnerId })
            .FirstOrDefaultAsync(cancellationToken);

        if (workspace is null)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "workspace.not_found",
                "Workspace not found.");
        }

        if (workspace.OwnerId == userId
            && (allowedRoles.Count == 0 || allowedRoles.Contains(WorkspaceRole.Owner)))
        {
            return true;
        }

        var member = await db.WorkspaceMembers
            .AsNoTracking()
            .Where(candidate => candidate.WorkspaceId == workspaceId
                && candidate.UserId == userId
                && candidate.Status == MemberStatus.Active)
            .Select(candidate => new { candidate.Role })
            .FirstOrDefaultAsync(cancellationToken);

        if (member is null)
        {
            return false;
        }

        return allowedRoles.Count == 0 || allowedRoles.Contains(member.Role);
    }
}
