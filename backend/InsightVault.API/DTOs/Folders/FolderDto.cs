namespace InsightVault.API.DTOs.Folders;

public sealed record FolderDto(
    Guid Id,
    Guid WorkspaceId,
    Guid? ParentFolderId,
    string Name,
    string? Description,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
