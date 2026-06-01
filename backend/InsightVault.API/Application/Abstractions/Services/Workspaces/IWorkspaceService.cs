using InsightVault.API.DTOs.Workspaces;

namespace InsightVault.API.Application.Abstractions.Services.Workspaces;

public interface IWorkspaceService
{
    // Workspace CRUD
    Task<IReadOnlyList<WorkspaceDto>> ListWorkspacesAsync(
        Guid userId,
        string? query,
        CancellationToken cancellationToken = default);

    Task<WorkspaceDto> CreateWorkspaceAsync(
        Guid userId,
        CreateWorkspaceRequest request,
        CancellationToken cancellationToken = default);

    Task<WorkspaceDto> GetWorkspaceAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<WorkspaceDto> UpdateWorkspaceAsync(
        Guid workspaceId,
        Guid userId,
        UpdateWorkspaceRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteWorkspaceAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);

    // Member management
    Task<IReadOnlyList<WorkspaceMemberDto>> ListMembersAsync(
        Guid workspaceId,
        Guid userId,
        CancellationToken cancellationToken = default);

    Task<WorkspaceMemberDto> AddMemberAsync(
        Guid workspaceId,
        Guid userId,
        AddWorkspaceMemberRequest request,
        CancellationToken cancellationToken = default);

    Task<WorkspaceMemberDto> UpdateMemberAsync(
        Guid workspaceId,
        Guid memberId,
        Guid userId,
        UpdateWorkspaceMemberRequest request,
        CancellationToken cancellationToken = default);

    Task RemoveMemberAsync(
        Guid workspaceId,
        Guid memberId,
        Guid userId,
        CancellationToken cancellationToken = default);
}
