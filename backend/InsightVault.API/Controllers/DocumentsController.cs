using InsightVault.API.Application.Abstractions.Services.Documents;
using InsightVault.API.DTOs.Documents;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InsightVault.API.Controllers;

[ApiController]
[Authorize]
public sealed class DocumentsController(IDocumentService documentService) : ControllerBase
{
    [HttpGet("api/workspaces/{workspaceId:guid}/documents")]
    public async Task<ActionResult<IReadOnlyList<DocumentDto>>> ListDocuments(
        Guid workspaceId,
        [FromQuery] Guid? folderId,
        [FromQuery] string? status,
        [FromQuery] string? q,
        CancellationToken cancellationToken)
    {
        var documents = await documentService.ListByWorkspaceAsync(
            workspaceId,
            folderId,
            status,
            q,
            cancellationToken);

        return Ok(documents);
    }

    [HttpPost("api/workspaces/{workspaceId:guid}/documents/presign-upload")]
    public async Task<ActionResult<PresignUploadResponse>> CreatePresignedUpload(
        Guid workspaceId,
        PresignUploadRequest request,
        CancellationToken cancellationToken)
    {
        var response = await documentService.CreatePresignedUploadAsync(
            workspaceId,
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpGet("api/workspaces/{workspaceId:guid}/trash/documents")]
    public async Task<ActionResult<IReadOnlyList<DocumentDto>>> ListTrashDocuments(
        Guid workspaceId,
        CancellationToken cancellationToken)
    {
        var documents = await documentService.ListTrashByWorkspaceAsync(
            workspaceId,
            cancellationToken);

        return Ok(documents);
    }

    [HttpGet("api/documents/{documentId:guid}")]
    public async Task<ActionResult<DocumentDto>> GetDocument(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        var document = await documentService.GetByIdAsync(documentId, cancellationToken);

        return Ok(document);
    }

    [HttpGet("api/documents/{documentId:guid}/original/access")]
    public async Task<ActionResult<DocumentOriginalAccessResponse>> GetOriginalAccess(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        var response = await documentService.GetOriginalAccessAsync(documentId, cancellationToken);

        return Ok(response);
    }

    [HttpGet("api/documents/{documentId:guid}/original/text")]
    public async Task<ActionResult<DocumentOriginalTextResponse>> GetOriginalText(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        var response = await documentService.GetOriginalTextAsync(documentId, cancellationToken);

        return Ok(response);
    }

    [HttpPatch("api/documents/{documentId:guid}")]
    public async Task<ActionResult<DocumentDto>> UpdateDocument(
        Guid documentId,
        UpdateDocumentRequest request,
        CancellationToken cancellationToken)
    {
        var document = await documentService.UpdateAsync(documentId, request, cancellationToken);

        return Ok(document);
    }

    [HttpPost("api/documents/{documentId:guid}/confirm-upload")]
    public async Task<ActionResult<ConfirmUploadResponse>> ConfirmUpload(
        Guid documentId,
        ConfirmUploadRequest request,
        CancellationToken cancellationToken)
    {
        var response = await documentService.ConfirmUploadAsync(
            documentId,
            request,
            cancellationToken);

        return Ok(response);
    }

    [HttpDelete("api/documents/{documentId:guid}")]
    public async Task<IActionResult> DeleteDocument(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        await documentService.DeleteAsync(documentId, cancellationToken);

        return NoContent();
    }

    [HttpPost("api/documents/{documentId:guid}/restore")]
    public async Task<ActionResult<DocumentDto>> RestoreDocument(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        var document = await documentService.RestoreAsync(documentId, cancellationToken);

        return Ok(document);
    }

    [HttpDelete("api/documents/{documentId:guid}/hard-delete")]
    public async Task<IActionResult> HardDeleteDocument(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        await documentService.HardDeleteAsync(documentId, cancellationToken);

        return NoContent();
    }

    [HttpPost("api/documents/{documentId:guid}/retry-processing")]
    public async Task<ActionResult<ConfirmUploadResponse>> RetryProcessing(
        Guid documentId,
        CancellationToken cancellationToken)
    {
        var response = await documentService.RetryProcessingAsync(documentId, cancellationToken);

        return Ok(response);
    }
}
