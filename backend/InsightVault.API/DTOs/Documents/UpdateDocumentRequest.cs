namespace InsightVault.API.DTOs.Documents;

public sealed record UpdateDocumentRequest(Guid? FolderId, bool HasFolderId);
