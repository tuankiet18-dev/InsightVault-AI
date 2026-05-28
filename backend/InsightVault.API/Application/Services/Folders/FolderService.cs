using InsightVault.API.Application.Abstractions.Auth;
using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Application.Abstractions.Services.Folders;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.DTOs.Folders;

namespace InsightVault.API.Application.Services.Folders;

public sealed class FolderService(
    InsightVaultDbContext db,
    ICurrentUserService currentUserService,
    IWorkspacePermissionService workspacePermissionService,
    IFolderRepository folderRepository) : IFolderService
{
    public async Task<IReadOnlyList<FolderDto>> ListByWorkspaceAsync(
        Guid workspaceId,
        Guid? parentFolderId = null,
        CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.GetRequiredUserId();
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(workspaceId, userId, cancellationToken);

        if (parentFolderId.HasValue)
        {
            await EnsureParentFolderExistsAsync(workspaceId, parentFolderId.Value, cancellationToken);
        }

        var folders = await folderRepository.ListByWorkspaceAsync(
            workspaceId,
            parentFolderId,
            cancellationToken);

        return folders.Select(ToDto).ToList();
    }

    public async Task<FolderDto> GetByIdAsync(
        Guid folderId,
        CancellationToken cancellationToken = default)
    {
        var folder = await GetActiveFolderAsync(folderId, cancellationToken);
        var userId = currentUserService.GetRequiredUserId();
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(folder.WorkspaceId, userId, cancellationToken);

        return ToDto(folder);
    }

    public async Task<FolderDto> CreateAsync(
        Guid workspaceId,
        CreateFolderRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = currentUserService.GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageFoldersAsync(workspaceId, userId, cancellationToken);

        var name = NormalizeName(request.Name);
        if (request.ParentFolderId.HasValue)
        {
            await EnsureParentFolderExistsAsync(workspaceId, request.ParentFolderId.Value, cancellationToken);
        }

        await EnsureNameIsUniqueAsync(
            workspaceId,
            request.ParentFolderId,
            name,
            excludedFolderId: null,
            cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var folder = new Folder
        {
            WorkspaceId = workspaceId,
            ParentFolderId = request.ParentFolderId,
            Name = name,
            Description = NormalizeOptionalText(request.Description),
            CreatedById = userId,
            CreatedAt = now,
            UpdatedAt = now
        };

        await folderRepository.AddAsync(folder, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return ToDto(folder);
    }

    public async Task<FolderDto> UpdateAsync(
        Guid folderId,
        UpdateFolderRequest request,
        CancellationToken cancellationToken = default)
    {
        var folder = await GetActiveFolderAsync(folderId, cancellationToken);
        var userId = currentUserService.GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageFoldersAsync(folder.WorkspaceId, userId, cancellationToken);

        var nextName = request.Name is null ? folder.Name : NormalizeName(request.Name);
        var nextParentFolderId = folder.ParentFolderId;

        if (request.HasParentFolderId)
        {
            nextParentFolderId = request.GetParentFolderId();
            await EnsureFolderCanMoveAsync(folder, nextParentFolderId, cancellationToken);
        }

        await EnsureNameIsUniqueAsync(
            folder.WorkspaceId,
            nextParentFolderId,
            nextName,
            folder.Id,
            cancellationToken);

        folder.Name = nextName;
        if (request.Description is not null)
        {
            folder.Description = NormalizeOptionalText(request.Description);
        }

        if (request.HasParentFolderId)
        {
            folder.ParentFolderId = nextParentFolderId;
        }

        folder.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync(cancellationToken);

        return ToDto(folder);
    }

    public async Task DeleteAsync(
        Guid folderId,
        CancellationToken cancellationToken = default)
    {
        var folder = await GetActiveFolderAsync(folderId, cancellationToken);
        var userId = currentUserService.GetRequiredUserId();
        await workspacePermissionService.EnsureCanManageFoldersAsync(folder.WorkspaceId, userId, cancellationToken);

        var folders = await folderRepository.ListActiveByWorkspaceAsync(
            folder.WorkspaceId,
            cancellationToken);
        var folderTree = GetFolderTreeForDelete(folders, folder.Id);
        var deletedAt = DateTimeOffset.UtcNow;

        foreach (var item in folderTree)
        {
            item.DeletedAt = deletedAt;
            item.UpdatedAt = deletedAt;
        }

        await db.SaveChangesAsync(cancellationToken);
    }

    private static IReadOnlyList<Folder> GetFolderTreeForDelete(
        IReadOnlyList<Folder> folders,
        Guid rootFolderId)
    {
        var foldersByParentId = folders
            .Where(folder => folder.ParentFolderId.HasValue)
            .GroupBy(folder => folder.ParentFolderId!.Value)
            .ToDictionary(group => group.Key, group => group.ToList());

        var result = new List<Folder>();
        var stack = new Stack<Guid>();
        stack.Push(rootFolderId);

        while (stack.Count > 0)
        {
            var currentFolderId = stack.Pop();
            var currentFolder = folders.FirstOrDefault(folder => folder.Id == currentFolderId);

            if (currentFolder is null)
            {
                continue;
            }

            result.Add(currentFolder);

            if (!foldersByParentId.TryGetValue(currentFolderId, out var childFolders))
            {
                continue;
            }

            foreach (var childFolder in childFolders)
            {
                stack.Push(childFolder.Id);
            }
        }

        return result;
    }

    private async Task EnsureFolderCanMoveAsync(
        Folder folder,
        Guid? nextParentFolderId,
        CancellationToken cancellationToken)
    {
        if (!nextParentFolderId.HasValue)
        {
            return;
        }

        if (nextParentFolderId.Value == folder.Id)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "folder.invalid_move",
                "A folder cannot be its own parent.");
        }

        var parent = await folderRepository.GetByIdInWorkspaceAsync(
            nextParentFolderId.Value,
            folder.WorkspaceId,
            cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status404NotFound,
                "folder.parent_not_found",
                "Parent folder not found.");

        while (parent.ParentFolderId.HasValue)
        {
            if (parent.ParentFolderId.Value == folder.Id)
            {
                throw new ApiException(
                    StatusCodes.Status409Conflict,
                    "folder.invalid_move",
                    "A folder cannot be moved under one of its descendants.");
            }

            parent = await folderRepository.GetByIdInWorkspaceAsync(
                parent.ParentFolderId.Value,
                folder.WorkspaceId,
                cancellationToken)
                ?? throw new ApiException(
                    StatusCodes.Status404NotFound,
                    "folder.parent_not_found",
                    "Parent folder not found.");
        }
    }

    private async Task EnsureParentFolderExistsAsync(
        Guid workspaceId,
        Guid parentFolderId,
        CancellationToken cancellationToken)
    {
        if (!await folderRepository.ExistsInWorkspaceAsync(parentFolderId, workspaceId, cancellationToken))
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "folder.parent_not_found",
                "Parent folder not found.");
        }
    }

    private async Task EnsureNameIsUniqueAsync(
        Guid workspaceId,
        Guid? parentFolderId,
        string name,
        Guid? excludedFolderId,
        CancellationToken cancellationToken)
    {
        var exists = await folderRepository.HasSiblingWithNameAsync(
            workspaceId,
            parentFolderId,
            name,
            excludedFolderId,
            cancellationToken);

        if (exists)
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "folder.name_conflict",
                "A folder with the same name already exists in this location.");
        }
    }

    private async Task<Folder> GetActiveFolderAsync(
        Guid folderId,
        CancellationToken cancellationToken)
    {
        var folder = await folderRepository.GetByIdAsync(folderId, cancellationToken);

        if (folder is null || folder.DeletedAt is not null)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "folder.not_found",
                "Folder not found.");
        }

        return folder;
    }

    private static string NormalizeName(string name)
    {
        var normalizedName = name.Trim();

        if (string.IsNullOrWhiteSpace(normalizedName))
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "folder.invalid_name",
                "Folder name is required.");
        }

        return normalizedName;
    }

    private static string? NormalizeOptionalText(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    }

    private static FolderDto ToDto(Folder folder)
    {
        return new FolderDto(
            folder.Id,
            folder.WorkspaceId,
            folder.ParentFolderId,
            folder.Name,
            folder.Description,
            folder.CreatedAt,
            folder.UpdatedAt);
    }
}
