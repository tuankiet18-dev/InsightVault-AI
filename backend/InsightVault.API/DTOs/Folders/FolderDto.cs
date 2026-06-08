namespace InsightVault.API.DTOs.Folders;

public sealed record FolderDto(
    Guid Id,
    Guid WorkspaceId,
    Guid? ParentFolderId,
    string Name,
    string? Description,
    Guid? CreatedById,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
