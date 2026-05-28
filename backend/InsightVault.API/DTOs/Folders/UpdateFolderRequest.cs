namespace InsightVault.API.DTOs.Folders;

public sealed record UpdateFolderRequest(
    string? Name = null,
    string? Description = null,
    Guid? ParentFolderId = null);
