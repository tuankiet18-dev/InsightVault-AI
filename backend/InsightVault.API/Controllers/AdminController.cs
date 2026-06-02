using System.Text.Json.Nodes;
using InsightVault.API.Data;
using InsightVault.API.DTOs.Admin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Controllers;

[ApiController]
[Authorize(Roles = "admin,Admin")]
[Route("api/admin")]
public sealed class AdminController(InsightVaultDbContext dbContext) : ControllerBase
{
    [HttpGet("retrieval-debug")]
    public async Task<ActionResult<IReadOnlyList<RetrievalDebugSourceDto>>> GetRetrievalDebug(
        [FromQuery] Guid? workspaceId,
        [FromQuery] Guid? chatMessageId,
        [FromQuery] int limit = 50,
        CancellationToken cancellationToken = default)
    {
        limit = Math.Clamp(limit, 1, 200);

        var query = dbContext.ChatMessageSources
            .AsNoTracking()
            .Where(source => source.Metadata != "{}");

        if (workspaceId is not null)
        {
            query = query.Where(source => source.ChatMessage.ChatSession.WorkspaceId == workspaceId);
        }

        if (chatMessageId is not null)
        {
            query = query.Where(source => source.ChatMessageId == chatMessageId);
        }

        var rows = await query
            .OrderByDescending(source => source.CreatedAt)
            .ThenBy(source => source.SourceOrder)
            .Take(limit)
            .Select(source => new
            {
                SourceId = source.Id,
                source.ChatMessageId,
                source.ChatMessage.ChatSessionId,
                WorkspaceId = source.ChatMessage.ChatSession.WorkspaceId,
                source.DocumentId,
                source.DocumentChunkId,
                source.FileName,
                source.SourceOrder,
                source.SimilarityScore,
                source.Metadata,
                source.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(rows.Select(row =>
        {
            var metadata = ParseMetadata(row.Metadata);
            return new RetrievalDebugSourceDto(
                row.SourceId,
                row.ChatMessageId,
                row.ChatSessionId,
                row.WorkspaceId,
                row.DocumentId,
                row.DocumentChunkId,
                row.FileName,
                row.SourceOrder,
                row.SimilarityScore,
                metadata["retrieval_debug"]?.DeepClone(),
                metadata,
                row.CreatedAt);
        }).ToList());
    }

    private static JsonNode ParseMetadata(string metadata)
    {
        if (string.IsNullOrWhiteSpace(metadata))
        {
            return new JsonObject();
        }

        try
        {
            return JsonNode.Parse(metadata) ?? new JsonObject();
        }
        catch
        {
            return new JsonObject { ["raw"] = metadata };
        }
    }
}
