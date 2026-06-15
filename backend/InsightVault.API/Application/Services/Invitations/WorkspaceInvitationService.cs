using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Abstractions.Services.Emails;
using InsightVault.API.Application.Abstractions.Services.Invitations;
using InsightVault.API.Application.Abstractions.Services.Workspaces;
using InsightVault.API.Application.Services.Workspaces;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.DTOs.Invitations;
using Microsoft.Extensions.Options;

namespace InsightVault.API.Application.Services.Invitations;

public sealed class WorkspaceInvitationService(
    IWorkspaceInvitationRepository invitationRepository,
    IWorkspaceRepository workspaceRepository,
    IUserRepository userRepository,
    IWorkspacePermissionService permissionService,
    ICurrentUserService currentUserService,
    IEmailService emailService,
    IOptions<WorkspaceInvitationOptions> options,
    InsightVaultDbContext db) : IWorkspaceInvitationService
{
    public async Task<WorkspaceInvitationDto> CreateAsync(
        Guid workspaceId,
        CreateWorkspaceInvitationRequest request,
        CancellationToken cancellationToken = default)
    {
        var inviterId = GetCurrentUserId();
        await permissionService.EnsureCanManageMembersAsync(workspaceId, inviterId, cancellationToken);

        var workspace = await workspaceRepository.GetByIdAsync(workspaceId, cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status404NotFound,
                "workspace.not_found",
                "Workspace not found.");

        if (workspace.DeletedAt is not null)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "workspace.not_found",
                "Workspace not found.");
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "invitation.invalid_request",
                "Invitation email is required.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var invitedUser = await userRepository.GetByEmailAsync(normalizedEmail, cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status404NotFound,
                "invitation.user_not_found",
                "A registered user with this email was not found.");

        if (!invitedUser.IsActive)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "invitation.inactive_user",
                "Cannot invite an inactive user.");
        }

        if (invitedUser.SystemRole == SystemRole.Admin)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "invitation.admin_target_not_allowed",
                "System administrators cannot be invited into workspace content.");
        }

        var existingMember = await workspaceRepository.GetMemberByEmailAsync(
            workspaceId,
            normalizedEmail,
            cancellationToken);

        if (existingMember is { Status: not MemberStatus.Removed })
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "invitation.duplicate_member",
                "This user is already a member of the workspace.");
        }

        var existingInvitation = await invitationRepository.GetPendingByWorkspaceAndUserAsync(
            workspaceId,
            invitedUser.Id,
            cancellationToken);

        if (existingInvitation is not null)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "invitation.pending_exists",
                "A pending invitation already exists for this user.");
        }

        var now = DateTimeOffset.UtcNow;
        var targetRole = WorkspaceMapper.ToDomainRole(request.Role);
        var expiresAt = now.AddDays(options.Value.ExpiresDays);
        var invitation = new WorkspaceInvitation
        {
            WorkspaceId = workspaceId,
            InvitedUserId = invitedUser.Id,
            Email = normalizedEmail,
            Role = targetRole,
            Status = WorkspaceInvitationStatus.Pending,
            ExpiresAt = expiresAt,
            InvitedById = inviterId,
            CreatedAt = now,
            UpdatedAt = now,
            Workspace = workspace
        };

        await invitationRepository.AddAsync(invitation, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        var inviter = await userRepository.GetByIdAsync(inviterId, cancellationToken);
        var inviterName = inviter?.FullName ?? "Someone";
        var viewInvitationUrl = BuildInvitationUrl(invitation.Id);

        await emailService.SendWorkspaceInviteAsync(
            normalizedEmail,
            inviterName,
            workspace.Name,
            targetRole.ToString(),
            viewInvitationUrl,
            expiresAt,
            cancellationToken);

        var savedInvitation = await invitationRepository.GetByIdWithDetailsAsync(invitation.Id, cancellationToken)
            ?? invitation;

        return WorkspaceInvitationMapper.ToDto(savedInvitation);
    }

    public async Task<IReadOnlyList<WorkspaceInvitationDto>> ListForCurrentUserAsync(
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        await EnsureActiveContentUserAsync(userId, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var invitations = await invitationRepository.ListPendingByUserAsync(userId, cancellationToken);
        return invitations
            .Where(invitation => invitation.ExpiresAt > now)
            .Select(WorkspaceInvitationMapper.ToDto)
            .ToList();
    }

    public async Task<WorkspaceInvitationDto> GetForCurrentUserAsync(
        Guid invitationId,
        CancellationToken cancellationToken = default)
    {
        var invitation = await GetInvitationForCurrentUserAsync(invitationId, cancellationToken);
        await MarkExpiredIfNeededAsync(invitation, cancellationToken);

        return WorkspaceInvitationMapper.ToDto(invitation);
    }

    public async Task<WorkspaceInvitationDto> AcceptAsync(
        Guid invitationId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        var currentUser = await EnsureActiveContentUserAsync(userId, cancellationToken);
        var invitation = await GetInvitationForCurrentUserAsync(invitationId, cancellationToken);

        if (invitation.Status == WorkspaceInvitationStatus.Accepted)
        {
            return WorkspaceInvitationMapper.ToDto(invitation);
        }

        EnsurePending(invitation);

        if (invitation.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            await MarkExpiredAsync(invitation, cancellationToken);
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "invitation.expired",
                "This invitation has expired.");
        }

        if (invitation.Workspace.DeletedAt is not null)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "workspace.not_found",
                "Workspace not found.");
        }

        var now = DateTimeOffset.UtcNow;
        var existingMember = await workspaceRepository.GetMemberByEmailAsync(
            invitation.WorkspaceId,
            invitation.Email,
            cancellationToken);

        if (existingMember is null)
        {
            var member = new WorkspaceMember
            {
                WorkspaceId = invitation.WorkspaceId,
                UserId = currentUser.Id,
                Email = currentUser.Email,
                Role = invitation.Role,
                Status = MemberStatus.Active,
                InvitedById = invitation.InvitedById,
                InvitedAt = invitation.CreatedAt,
                JoinedAt = now,
                CreatedAt = now,
                UpdatedAt = now
            };

            await db.WorkspaceMembers.AddAsync(member, cancellationToken);
        }
        else if (existingMember.Status == MemberStatus.Removed)
        {
            existingMember.UserId = currentUser.Id;
            existingMember.Email = currentUser.Email;
            existingMember.Role = invitation.Role;
            existingMember.Status = MemberStatus.Active;
            existingMember.InvitedById = invitation.InvitedById;
            existingMember.InvitedAt = invitation.CreatedAt;
            existingMember.JoinedAt = now;
            existingMember.RemovedAt = null;
            existingMember.UpdatedAt = now;
            db.WorkspaceMembers.Update(existingMember);
        }

        invitation.Status = WorkspaceInvitationStatus.Accepted;
        invitation.AcceptedAt = now;
        invitation.UpdatedAt = now;
        invitationRepository.Update(invitation);

        await db.SaveChangesAsync(cancellationToken);
        return WorkspaceInvitationMapper.ToDto(invitation);
    }

    public async Task<WorkspaceInvitationDto> DeclineAsync(
        Guid invitationId,
        CancellationToken cancellationToken = default)
    {
        var invitation = await GetInvitationForCurrentUserAsync(invitationId, cancellationToken);

        if (invitation.Status == WorkspaceInvitationStatus.Declined)
        {
            return WorkspaceInvitationMapper.ToDto(invitation);
        }

        EnsurePending(invitation);

        if (invitation.ExpiresAt <= DateTimeOffset.UtcNow)
        {
            await MarkExpiredAsync(invitation, cancellationToken);
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "invitation.expired",
                "This invitation has expired.");
        }

        var now = DateTimeOffset.UtcNow;
        invitation.Status = WorkspaceInvitationStatus.Declined;
        invitation.DeclinedAt = now;
        invitation.UpdatedAt = now;
        invitationRepository.Update(invitation);
        await db.SaveChangesAsync(cancellationToken);

        return WorkspaceInvitationMapper.ToDto(invitation);
    }

    public async Task<IReadOnlyList<WorkspaceInvitationDto>> ListByWorkspaceAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        await permissionService.EnsureCanManageMembersAsync(workspaceId, userId, cancellationToken);

        var invitations = await invitationRepository.ListByWorkspaceAsync(workspaceId, cancellationToken);
        return invitations.Select(WorkspaceInvitationMapper.ToDto).ToList();
    }

    private Guid GetCurrentUserId()
    {
        return currentUserService.UserId
            ?? throw new ApiException(
                StatusCodes.Status401Unauthorized,
                "auth.unauthorized",
                "Authentication is required.");
    }

    private async Task<User> EnsureActiveContentUserAsync(
        Guid userId,
        CancellationToken cancellationToken)
    {
        var user = await userRepository.GetByIdAsync(userId, cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status401Unauthorized,
                "auth.unauthorized",
                "Invalid or inactive user.");

        if (!user.IsActive)
        {
            throw new ApiException(
                StatusCodes.Status401Unauthorized,
                "auth.unauthorized",
                "Invalid or inactive user.");
        }

        if (user.SystemRole == SystemRole.Admin)
        {
            throw new ApiException(
                StatusCodes.Status403Forbidden,
                "workspace.admin_content_forbidden",
                "System administrators cannot access workspace content.");
        }

        return user;
    }

    private async Task<WorkspaceInvitation> GetInvitationForCurrentUserAsync(
        Guid invitationId,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        await EnsureActiveContentUserAsync(userId, cancellationToken);

        return await invitationRepository.GetForCurrentUserAsync(invitationId, userId, cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status404NotFound,
                "invitation.not_found",
                "Invitation not found.");
    }

    private async Task MarkExpiredIfNeededAsync(
        WorkspaceInvitation invitation,
        CancellationToken cancellationToken)
    {
        if (invitation.Status != WorkspaceInvitationStatus.Pending
            || invitation.ExpiresAt > DateTimeOffset.UtcNow)
        {
            return;
        }

        await MarkExpiredAsync(invitation, cancellationToken);
    }

    private async Task MarkExpiredAsync(
        WorkspaceInvitation invitation,
        CancellationToken cancellationToken)
    {
        invitation.Status = WorkspaceInvitationStatus.Expired;
        invitation.UpdatedAt = DateTimeOffset.UtcNow;
        invitationRepository.Update(invitation);
        await db.SaveChangesAsync(cancellationToken);
    }

    private static void EnsurePending(WorkspaceInvitation invitation)
    {
        if (invitation.Status == WorkspaceInvitationStatus.Pending)
        {
            return;
        }

        throw new ApiException(
            StatusCodes.Status409Conflict,
            "invitation.not_pending",
            "This invitation is no longer pending.");
    }

    private string BuildInvitationUrl(Guid invitationId)
    {
        var baseUrl = options.Value.FrontendBaseUrl.TrimEnd('/');
        return $"{baseUrl}/invitations/{invitationId}";
    }
}
