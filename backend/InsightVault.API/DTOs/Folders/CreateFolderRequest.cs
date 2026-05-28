namespace InsightVault.API.DTOs.Folders;

public sealed record CreateFolderRequest(
    string Name,
    string? Description = null,
    Guid? ParentFolderId = null);
