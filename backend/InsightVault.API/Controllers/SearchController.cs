using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Abstractions.Services.Workspaces;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.DTOs.Search;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Controllers;

[ApiController]
[Authorize]
public sealed class SearchController(
    InsightVaultDbContext db,
    ICurrentUserService currentUserService,
    IWorkspacePermissionService workspacePermissionService) : ControllerBase
{
    private const int MaxResultsPerGroup = 8;
    private const int MaxSnippetLength = 220;

    [HttpGet("api/workspaces/{workspaceId:guid}/search")]
    public async Task<ActionResult<IReadOnlyList<WorkspaceSearchResultDto>>> Search(
        Guid workspaceId,
        [FromQuery] string q,
        CancellationToken cancellationToken)
    {
        var userId = currentUserService.UserId
            ?? throw new ApiException(
                StatusCodes.Status401Unauthorized,
                "auth.unauthorized",
                "A valid authenticated user is required.");
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(workspaceId, userId, cancellationToken);

        var query = NormalizeQuery(q);
        if (query is null)
        {
            return Ok(Array.Empty<WorkspaceSearchResultDto>());
        }

        var like = $"%{query}%";

        var documents = await db.Documents
            .AsNoTracking()
            .Where(document => document.WorkspaceId == workspaceId
                && document.DeletedAt == null
                && (EF.Functions.ILike(document.OriginalFileName, like)
                    || EF.Functions.ILike(document.FileName, like)
                    || EF.Functions.ILike(document.Summary ?? string.Empty, like)))
            .OrderByDescending(document => document.UpdatedAt)
            .Take(MaxResultsPerGroup)
            .Select(document => new WorkspaceSearchResultDto(
                "document",
                document.OriginalFileName,
                document.Status.ToString(),
                document.Summary,
                document.Id,
                null,
                null,
                null,
                document.UpdatedAt))
            .ToListAsync(cancellationToken);

        var reports = await db.Reports
            .AsNoTracking()
            .Where(report => report.WorkspaceId == workspaceId
                && report.DeletedAt == null
                && (EF.Functions.ILike(report.Title, like)
                    || EF.Functions.ILike(report.MarkdownContent, like)))
            .OrderByDescending(report => report.UpdatedAt)
            .Take(MaxResultsPerGroup)
            .Select(report => new WorkspaceSearchResultDto(
                "report",
                report.Title,
                report.ReportType.ToString(),
                report.MarkdownContent,
                null,
                null,
                report.Id,
                null,
                report.UpdatedAt))
            .ToListAsync(cancellationToken);

        var chunks = await db.DocumentChunks
            .AsNoTracking()
            .Where(chunk => chunk.WorkspaceId == workspaceId
                && chunk.Document.DeletedAt == null
                && EF.Functions.ILike(chunk.Content, like))
            .OrderBy(chunk => chunk.Document.OriginalFileName)
            .ThenBy(chunk => chunk.ChunkIndex)
            .Take(MaxResultsPerGroup)
            .Select(chunk => new WorkspaceSearchResultDto(
                "chunk",
                chunk.Document.OriginalFileName,
                $"Chunk {chunk.ChunkIndex}",
                chunk.Content,
                chunk.DocumentId,
                chunk.Id,
                null,
                chunk.ChunkIndex,
                chunk.Document.UpdatedAt))
            .ToListAsync(cancellationToken);

        var results = documents
            .Concat(reports)
            .Concat(chunks)
            .Select(result => result with { Snippet = BuildSnippet(result.Snippet, query) })
            .OrderBy(result => result.Type == "document" ? 0 : result.Type == "report" ? 1 : 2)
            .ThenByDescending(result => result.UpdatedAt)
            .ToList();

        return Ok(results);
    }

    private static string? NormalizeQuery(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return null;
        }

        var query = value.Trim();
        return query.Length < 2 ? null : query;
    }

    private static string? BuildSnippet(string? content, string query)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            return null;
        }

        var normalized = content.Trim();
        var index = normalized.IndexOf(query, StringComparison.OrdinalIgnoreCase);
        if (index < 0)
        {
            return Truncate(normalized, MaxSnippetLength);
        }

        var start = Math.Max(0, index - 70);
        var length = Math.Min(MaxSnippetLength, normalized.Length - start);
        var snippet = normalized.Substring(start, length).Trim();
        return $"{(start > 0 ? "... " : string.Empty)}{snippet}{(start + length < normalized.Length ? " ..." : string.Empty)}";
    }

    private static string Truncate(string value, int maxLength)
    {
        return value.Length <= maxLength ? value : $"{value[..maxLength].Trim()} ...";
    }
}
