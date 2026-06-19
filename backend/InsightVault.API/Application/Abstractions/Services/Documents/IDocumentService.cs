using InsightVault.API.DTOs.Documents;

namespace InsightVault.API.Application.Abstractions.Services.Documents;

public interface IDocumentService
{
    Task<IReadOnlyList<DocumentDto>> ListByWorkspaceAsync(
        Guid workspaceId,
        Guid? folderId = null,
        string? status = null,
        string? q = null,
        CancellationToken cancellationToken = default);

    Task<DocumentDto> GetByIdAsync(
        Guid documentId,
        CancellationToken cancellationToken = default);

    Task<DocumentOriginalAccessResponse> GetOriginalAccessAsync(
        Guid documentId,
        CancellationToken cancellationToken = default);

    Task<DocumentOriginalTextResponse> GetOriginalTextAsync(
        Guid documentId,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DocumentChunkDto>> ListChunksAsync(
        Guid documentId,
        CancellationToken cancellationToken = default);

    Task<DocumentExtractedTextResponse> GetExtractedTextAsync(
        Guid documentId,
        CancellationToken cancellationToken = default);

    Task<DocumentDto> UpdateAsync(
        Guid documentId,
        UpdateDocumentRequest request,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyList<DocumentDto>> ListTrashByWorkspaceAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default);

    Task<PresignUploadResponse> CreatePresignedUploadAsync(
        Guid workspaceId,
        PresignUploadRequest request,
        CancellationToken cancellationToken = default);

    Task<ConfirmUploadResponse> ConfirmUploadAsync(
        Guid documentId,
        ConfirmUploadRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteAsync(
        Guid documentId,
        CancellationToken cancellationToken = default);

    Task<DocumentDto> RestoreAsync(
        Guid documentId,
        CancellationToken cancellationToken = default);

    Task HardDeleteAsync(
        Guid documentId,
        CancellationToken cancellationToken = default);

    Task<ConfirmUploadResponse> RetryProcessingAsync(
        Guid documentId,
        CancellationToken cancellationToken = default);
}
