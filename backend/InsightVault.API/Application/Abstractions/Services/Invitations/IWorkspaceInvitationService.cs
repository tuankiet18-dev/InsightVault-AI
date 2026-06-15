using InsightVault.API.DTOs.Invitations;

namespace InsightVault.API.Application.Abstractions.Services.Invitations;

public interface IWorkspaceInvitationService
{
    Task<WorkspaceInvitationDto> CreateAsync(
        Guid workspaceId,
        CreateWorkspaceInvitationRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WorkspaceInvitationDto>> ListForCurrentUserAsync(
        CancellationToken cancellationToken = default);

    Task<WorkspaceInvitationDto> GetForCurrentUserAsync(
        Guid invitationId,
        CancellationToken cancellationToken = default);

    Task<WorkspaceInvitationDto> AcceptAsync(
        Guid invitationId,
        CancellationToken cancellationToken = default);

    Task<WorkspaceInvitationDto> DeclineAsync(
        Guid invitationId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<WorkspaceInvitationDto>> ListByWorkspaceAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);
}
