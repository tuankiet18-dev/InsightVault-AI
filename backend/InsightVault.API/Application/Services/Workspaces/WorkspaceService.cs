using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Application.Abstractions.Services.Workspaces;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.DTOs.Workspaces;
using InsightVault.API.Application.Abstractions.Services.Emails;

namespace InsightVault.API.Application.Services.Workspaces;

public sealed class WorkspaceService(
    IWorkspaceRepository workspaceRepository,
    IUserRepository userRepository,
    IWorkspacePermissionService permissionService,
    IEmailService emailService,
    InsightVaultDbContext db) : IWorkspaceService
{
    // ── Workspace CRUD ──────────────────────────────────────────────

    public async Task<IReadOnlyList<WorkspaceDto>> ListWorkspacesAsync(
        Guid userId,
        string? query,
        CancellationToken cancellationToken = default)
    {
        await GetActiveContentUserAsync(userId, cancellationToken);
        var workspaces = await workspaceRepository.ListByUserAsync(userId, query, cancellationToken);

        var result = new List<WorkspaceDto>(workspaces.Count);
        foreach (var workspace in workspaces)
        {
            var role = await permissionService.GetUserRoleAsync(workspace.Id, userId, cancellationToken);
            if (role.HasValue)
            {
                result.Add(WorkspaceMapper.ToDto(workspace, role.Value));
            }
        }

        return result;
    }

    public async Task<WorkspaceDto> CreateWorkspaceAsync(
        Guid userId,
        CreateWorkspaceRequest request,
        CancellationToken cancellationToken = default)
    {
        var currentUser = await GetActiveContentUserAsync(userId, cancellationToken);

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("Workspace name is required.", nameof(request));
        }

        var now = DateTimeOffset.UtcNow;

        var workspace = new Workspace
        {
            OwnerId = userId,
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            CreatedAt = now,
            UpdatedAt = now
        };

        var ownerMember = new WorkspaceMember
        {
            WorkspaceId = workspace.Id,
            UserId = userId,
            Email = currentUser.Email,
            Role = WorkspaceRole.Owner,
            Status = MemberStatus.Active,
            InvitedById = userId,
            InvitedAt = now,
            JoinedAt = now,
            CreatedAt = now,
            UpdatedAt = now
        };

        workspace.Members.Add(ownerMember);

        await workspaceRepository.AddAsync(workspace, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return WorkspaceMapper.ToDto(workspace, WorkspaceRole.Owner);
    }

    private async Task<User> GetActiveContentUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new UnauthorizedAccessException("Invalid or inactive user.");

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Invalid or inactive user.");
        }

        if (user.SystemRole == SystemRole.Admin)
        {
            throw new ApiException(
                StatusCodes.Status403Forbidden,
                "workspace.admin_content_forbidden",
                "System administrators cannot create or access workspace content.");
        }

        return user;
    }

    public async Task<WorkspaceDto> GetWorkspaceAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await permissionService.EnsureCanReadWorkspaceAsync(workspaceId, userId, cancellationToken);

        var workspace = await workspaceRepository.GetByIdAsync(workspaceId, cancellationToken)
            ?? throw new KeyNotFoundException("Workspace not found.");

        if (workspace.DeletedAt is not null)
        {
            throw new KeyNotFoundException("Workspace not found.");
        }

        var role = await permissionService.GetUserRoleAsync(workspaceId, userId, cancellationToken);
        return WorkspaceMapper.ToDto(workspace, role ?? WorkspaceRole.Viewer);
    }

    public async Task<WorkspaceDto> UpdateWorkspaceAsync(
        Guid workspaceId,
        Guid userId,
        UpdateWorkspaceRequest request,
        CancellationToken cancellationToken = default)
    {
        await permissionService.EnsureCanManageWorkspaceAsync(workspaceId, userId, cancellationToken);

        var workspace = await workspaceRepository.GetByIdAsync(workspaceId, cancellationToken)
            ?? throw new KeyNotFoundException("Workspace not found.");

        if (workspace.DeletedAt is not null)
        {
            throw new KeyNotFoundException("Workspace not found.");
        }

        if (request.Name is not null)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                throw new ArgumentException("Workspace name cannot be empty.", nameof(request));
            }

            workspace.Name = request.Name.Trim();
        }

        if (request.Description is not null)
        {
            workspace.Description = request.Description.Trim();
        }

        if (request.IsArchived.HasValue)
        {
            workspace.IsArchived = request.IsArchived.Value;
        }

        workspace.UpdatedAt = DateTimeOffset.UtcNow;
        workspaceRepository.Update(workspace);
        await db.SaveChangesAsync(cancellationToken);

        var role = await permissionService.GetUserRoleAsync(workspaceId, userId, cancellationToken);
        return WorkspaceMapper.ToDto(workspace, role ?? WorkspaceRole.Owner);
    }

    public async Task DeleteWorkspaceAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await permissionService.EnsureCanManageWorkspaceAsync(workspaceId, userId, cancellationToken);

        var workspace = await workspaceRepository.GetByIdAsync(workspaceId, cancellationToken)
            ?? throw new KeyNotFoundException("Workspace not found.");

        if (workspace.DeletedAt is not null)
        {
            throw new KeyNotFoundException("Workspace not found.");
        }

        // Soft delete
        workspace.DeletedAt = DateTimeOffset.UtcNow;
        workspace.UpdatedAt = DateTimeOffset.UtcNow;
        workspaceRepository.Update(workspace);
        await db.SaveChangesAsync(cancellationToken);
    }

    // ── Member Management ───────────────────────────────────────────

    public async Task<IReadOnlyList<WorkspaceMemberDto>> ListMembersAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await permissionService.EnsureCanManageMembersAsync(workspaceId, userId, cancellationToken);

        var members = await workspaceRepository.ListMembersAsync(workspaceId, cancellationToken);
        return members.Select(WorkspaceMapper.ToMemberDto).ToList();
    }

    public async Task<WorkspaceMemberDto> AddMemberAsync(
        Guid workspaceId,
        Guid userId,
        AddWorkspaceMemberRequest request,
        CancellationToken cancellationToken = default)
    {
        await permissionService.EnsureCanManageMembersAsync(workspaceId, userId, cancellationToken);

        // Validate workspace exists
        var workspace = await workspaceRepository.GetByIdAsync(workspaceId, cancellationToken)
            ?? throw new KeyNotFoundException("Workspace not found.");

        if (workspace.DeletedAt is not null)
        {
            throw new KeyNotFoundException("Workspace not found.");
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ArgumentException("Member email is required.", nameof(request));
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var existing = await workspaceRepository.GetMemberByEmailAsync(workspaceId, normalizedEmail, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var targetRole = WorkspaceMapper.ToDomainRole(request.Role);

        var existingUser = await userRepository.GetByEmailAsync(normalizedEmail, cancellationToken);
        var currentUser = await userRepository.GetByIdAsync(userId, cancellationToken);
        var inviterName = currentUser?.FullName ?? "Someone";

        if (existing is not null)
        {
            if (existing.Status != MemberStatus.Removed)
            {
                throw new InvalidOperationException("A member with this email already exists in the workspace.");
            }

            existing.UserId = existingUser?.Id;
            existing.Role = targetRole;
            existing.Status = existingUser is not null ? MemberStatus.Active : MemberStatus.Invited;
            existing.InvitedById = userId;
            existing.InvitedAt = now;
            existing.JoinedAt = existingUser is not null ? now : null;
            existing.RemovedAt = null;
            existing.UpdatedAt = now;

            db.WorkspaceMembers.Update(existing);
            await db.SaveChangesAsync(cancellationToken);

            await emailService.SendWorkspaceInviteAsync(normalizedEmail, inviterName, workspace.Name, targetRole.ToString(), cancellationToken);

            return WorkspaceMapper.ToMemberDto(existing);
        }

        var member = new WorkspaceMember
        {
            WorkspaceId = workspaceId,
            UserId = existingUser?.Id,
            Email = normalizedEmail,
            Role = targetRole,
            Status = existingUser is not null ? MemberStatus.Active : MemberStatus.Invited,
            InvitedById = userId,
            InvitedAt = now,
            JoinedAt = existingUser is not null ? now : null,
            CreatedAt = now,
            UpdatedAt = now
        };

        await db.WorkspaceMembers.AddAsync(member, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        await emailService.SendWorkspaceInviteAsync(normalizedEmail, inviterName, workspace.Name, targetRole.ToString(), cancellationToken);

        return WorkspaceMapper.ToMemberDto(member);
    }

    public async Task<WorkspaceMemberDto> UpdateMemberAsync(
        Guid workspaceId,
        Guid memberId,
        Guid userId,
        UpdateWorkspaceMemberRequest request,
        CancellationToken cancellationToken = default)
    {
        await permissionService.EnsureCanManageMembersAsync(workspaceId, userId, cancellationToken);

        var member = await workspaceRepository.GetMemberByIdAsync(workspaceId, memberId, cancellationToken)
            ?? throw new KeyNotFoundException("Workspace member not found.");

        // Prevent downgrading/removing the last owner
        if (member.Role == WorkspaceRole.Owner && request.Role.HasValue)
        {
            var newRole = WorkspaceMapper.ToDomainRole(request.Role.Value);
            if (newRole != WorkspaceRole.Owner)
            {
                var ownerCount = await workspaceRepository.CountActiveOwnerMembersAsync(workspaceId, cancellationToken);
                if (ownerCount <= 1)
                {
                    throw new InvalidOperationException("Cannot change the role of the last owner.");
                }
            }
        }

        bool roleChanged = false;
        string newRoleString = string.Empty;

        if (request.Role.HasValue)
        {
            var newRole = WorkspaceMapper.ToDomainRole(request.Role.Value);
            if (member.Role != newRole)
            {
                roleChanged = true;
                newRoleString = newRole.ToString();
            }
            member.Role = newRole;
        }

        bool removed = false;
        if (request.Status.HasValue)
        {
            var newStatus = WorkspaceMapper.ToDomainStatus(request.Status.Value);

            // Prevent making the last active owner inactive.
            if (newStatus != MemberStatus.Active
                && member.Role == WorkspaceRole.Owner
                && member.Status == MemberStatus.Active)
            {
                var ownerCount = await workspaceRepository.CountActiveOwnerMembersAsync(workspaceId, cancellationToken);
                if (ownerCount <= 1)
                {
                    throw new InvalidOperationException("Cannot deactivate the last active owner.");
                }
            }

            if (newStatus == MemberStatus.Active && member.UserId is null)
            {
                var existingUser = await userRepository.GetByEmailAsync(member.Email, cancellationToken);
                if (existingUser is null)
                {
                    throw new InvalidOperationException("Cannot activate a member before the user logs in.");
                }

                member.UserId = existingUser.Id;
                member.JoinedAt ??= DateTimeOffset.UtcNow;
            }

            member.Status = newStatus;
            if (newStatus == MemberStatus.Removed)
            {
                removed = true;
                member.RemovedAt = DateTimeOffset.UtcNow;
            }
        }

        member.UpdatedAt = DateTimeOffset.UtcNow;
        db.WorkspaceMembers.Update(member);
        await db.SaveChangesAsync(cancellationToken);

        if (roleChanged || removed)
        {
            var workspace = await workspaceRepository.GetByIdAsync(workspaceId, cancellationToken);
            if (workspace != null)
            {
                if (removed)
                {
                    await emailService.SendRemovedFromWorkspaceAsync(member.Email, workspace.Name, cancellationToken);
                }
                else if (roleChanged)
                {
                    await emailService.SendRoleUpdatedAsync(member.Email, workspace.Name, newRoleString, cancellationToken);
                }
            }
        }

        return WorkspaceMapper.ToMemberDto(member);
    }

    public async Task RemoveMemberAsync(
        Guid workspaceId,
        Guid memberId,
        Guid userId,
        CancellationToken cancellationToken = default)
    {
        await permissionService.EnsureCanManageMembersAsync(workspaceId, userId, cancellationToken);

        var member = await workspaceRepository.GetMemberByIdAsync(workspaceId, memberId, cancellationToken)
            ?? throw new KeyNotFoundException("Workspace member not found.");

        // Prevent removing the last active owner.
        if (member.Role == WorkspaceRole.Owner && member.Status == MemberStatus.Active)
        {
            var ownerCount = await workspaceRepository.CountActiveOwnerMembersAsync(workspaceId, cancellationToken);
            if (ownerCount <= 1)
            {
                throw new InvalidOperationException("Cannot remove the last owner from the workspace.");
            }
        }

        // Soft remove
        member.Status = MemberStatus.Removed;
        member.RemovedAt = DateTimeOffset.UtcNow;
        member.UpdatedAt = DateTimeOffset.UtcNow;
        db.WorkspaceMembers.Update(member);
        await db.SaveChangesAsync(cancellationToken);

        var workspace = await workspaceRepository.GetByIdAsync(workspaceId, cancellationToken);
        if (workspace != null)
        {
            await emailService.SendRemovedFromWorkspaceAsync(member.Email, workspace.Name, cancellationToken);
        }
    }
}
