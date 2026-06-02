using InsightVault.API.DTOs.Folders;

namespace InsightVault.API.Application.Abstractions.Services.Folders;

public interface IFolderService
{
    Task<IReadOnlyList<FolderDto>> ListByWorkspaceAsync(
        Guid workspaceId,
        Guid? parentFolderId = null,
        CancellationToken cancellationToken = default);

    Task<FolderDto> GetByIdAsync(
        Guid folderId,
        CancellationToken cancellationToken = default);

    Task<FolderDto> CreateAsync(
        Guid workspaceId,
        CreateFolderRequest request,
        CancellationToken cancellationToken = default);

    Task<FolderDto> UpdateAsync(
        Guid folderId,
        UpdateFolderRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid folderId,
        CancellationToken cancellationToken = default);
}
