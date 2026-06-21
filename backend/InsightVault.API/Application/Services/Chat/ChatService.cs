using System.Text.Json;
using InsightVault.API.Application.Abstractions.Ai;
using InsightVault.API.Application.Abstractions.Repositories;
using InsightVault.API.Application.Abstractions.Services.Auth;
using InsightVault.API.Application.Abstractions.Services.Chat;
using InsightVault.API.Application.Abstractions.Services.SystemSettings;
using InsightVault.API.Application.Abstractions.Services.Workspaces;
using InsightVault.API.Application.Services.SystemSettings;
using InsightVault.API.Common.Errors;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.DTOs.Chat;
using InsightVault.API.DTOs.Common;
using Microsoft.EntityFrameworkCore;

namespace InsightVault.API.Application.Services.Chat;

public sealed class ChatService(
    InsightVaultDbContext db,
    ICurrentUserService currentUserService,
    IWorkspacePermissionService workspacePermissionService,
    IDocumentRepository documentRepository,
    IFolderRepository folderRepository,
    IAiServiceClient aiServiceClient,
    ISystemSettingReader systemSettingReader) : IChatService
{
    private const int DefaultTopK = 5;
    private const int MaxTitleLength = 255;
    private const int ChatHistoryMessageLimit = 12;
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<IReadOnlyList<ChatSessionDto>> ListSessionsAsync(
        Guid workspaceId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(workspaceId, userId, cancellationToken);

        var sessions = await db.ChatSessions
            .AsNoTracking()
            .Where(session => session.WorkspaceId == workspaceId
                && session.CreatedById == userId
                && session.DeletedAt == null)
            .OrderByDescending(session => session.UpdatedAt)
            .ThenByDescending(session => session.CreatedAt)
            .ToListAsync(cancellationToken);

        return sessions.Select(ToSessionDto).ToList();
    }

    public async Task<ChatSessionDto> CreateSessionAsync(
        Guid workspaceId,
        CreateChatSessionRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(workspaceId, userId, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var session = new ChatSession
        {
            Id = Guid.NewGuid(),
            WorkspaceId = workspaceId,
            CreatedById = userId,
            Title = NormalizeTitle(request.Title),
            CreatedAt = now,
            UpdatedAt = now
        };

        await db.ChatSessions.AddAsync(session, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return ToSessionDto(session);
    }

    public async Task<ChatSessionDto> UpdateSessionAsync(
        Guid sessionId,
        UpdateChatSessionRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        var session = await GetActiveSessionForUserAsync(sessionId, userId, cancellationToken);
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(session.WorkspaceId, userId, cancellationToken);

        if (request.Title is not null)
        {
            session.Title = NormalizeTitle(request.Title);
        }

        if (request.IsPinned.HasValue)
        {
            session.IsPinned = request.IsPinned.Value;
        }

        session.UpdatedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync(cancellationToken);

        return ToSessionDto(session);
    }

    public async Task<IReadOnlyList<ChatMessageDto>> ListMessagesAsync(
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        var session = await GetActiveSessionForUserAsync(sessionId, userId, cancellationToken);
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(session.WorkspaceId, userId, cancellationToken);

        var messages = await db.ChatMessages
            .AsNoTracking()
            .Include(message => message.Contexts)
            .Include(message => message.Sources)
            .Where(message => message.ChatSessionId == session.Id
                && message.WorkspaceId == session.WorkspaceId)
            .OrderBy(message => message.CreatedAt)
            .ToListAsync(cancellationToken);

        return messages.Select(message => ToMessageDto(message)).ToList();
    }

    public async Task<ChatTurnResponse> SendMessageAsync(
        Guid sessionId,
        SendChatMessageRequest request,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        var session = await GetActiveSessionForUserAsync(sessionId, userId, cancellationToken);
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(session.WorkspaceId, userId, cancellationToken);

        var content = NormalizeMessageContent(request.Content);
        var resolvedScope = await ResolveScopeAsync(
            session.WorkspaceId,
            request.Contexts,
            cancellationToken);
        var aiSettings = await GetAiRuntimeSettingsAsync(cancellationToken);
        var chatHistory = await GetChatHistoryAsync(session, cancellationToken);
        var now = DateTimeOffset.UtcNow;
        var userMessage = new ChatMessage
        {
            Id = Guid.NewGuid(),
            WorkspaceId = session.WorkspaceId,
            ChatSessionId = session.Id,
            Role = ChatMessageRole.User,
            Content = content,
            Metadata = "{}",
            CreatedAt = now,
            Contexts = resolvedScope.Contexts.Select(context => new ChatMessageContext
            {
                Id = Guid.NewGuid(),
                WorkspaceId = session.WorkspaceId,
                ChatMessageId = Guid.Empty,
                ContextType = context.ContextType,
                FolderId = context.FolderId,
                DocumentId = context.DocumentId,
                ReportId = context.ReportId,
                IncludeSubfolders = context.IncludeSubfolders,
                ContextOrder = context.ContextOrder,
                ContextDisplayName = context.ContextDisplayName,
                ContextPath = context.ContextPath,
                CreatedAt = now
            }).ToList()
        };

        foreach (var context in userMessage.Contexts)
        {
            context.ChatMessageId = userMessage.Id;
        }

        session.UpdatedAt = now;
        await db.ChatMessages.AddAsync(userMessage, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        RagQueryResult ragResult;
        try
        {
            ragResult = await aiServiceClient.QueryRagAsync(
                new RagQueryAiRequest(
                    WorkspaceId: session.WorkspaceId,
                    Question: content,
                    Scope: resolvedScope.Scope,
                    FolderId: null,
                    DocumentIds: resolvedScope.DocumentIds,
                    ReportContext: resolvedScope.ReportContext,
                    TopK: DefaultTopK,
                    ChatHistory: chatHistory,
                    ModelName: aiSettings.ModelName,
                    WebSearchEnabled: aiSettings.WebSearchEnabled,
                    WebSearchProvider: null),
                cancellationToken);
        }
        catch (InvalidOperationException exception)
        {
            throw new ApiException(
                StatusCodes.Status502BadGateway,
                "chat.ai_failed",
                exception.Message);
        }

        var assistantMessage = new ChatMessage
        {
            Id = Guid.NewGuid(),
            WorkspaceId = session.WorkspaceId,
            ChatSessionId = session.Id,
            Role = ChatMessageRole.Assistant,
            Content = ragResult.Answer,
            ModelName = aiSettings.ModelName,
            Metadata = "{}",
            CreatedAt = now.AddMilliseconds(1),
            Sources = ragResult.Sources.Select((source, index) => new ChatMessageSource
            {
                Id = Guid.NewGuid(),
                ChatMessageId = Guid.Empty,
                DocumentId = source.DocumentId,
                DocumentChunkId = source.ChunkId,
                FileName = string.IsNullOrWhiteSpace(source.FileName) ? "Unknown source" : source.FileName,
                Snippet = source.Snippet,
                SimilarityScore = source.Similarity,
                Metadata = BuildSourceMetadata(source),
                SourceOrder = index,
                CreatedAt = now
            }).ToList()
        };

        foreach (var source in assistantMessage.Sources)
        {
            source.ChatMessageId = assistantMessage.Id;
        }

        if (session.Title == "New Chat" && chatHistory.Count == 0)
        {
            try
            {
                var titleResult = await aiServiceClient.GenerateChatTitleAsync(
                    content,
                    aiSettings.ModelName,
                    cancellationToken);
                
                session.Title = NormalizeTitle(titleResult.Title);
            }
            catch
            {
                // Ignore title generation errors and fallback to keeping "New Chat"
            }
        }

        session.UpdatedAt = now;
        await db.ChatMessages.AddAsync(assistantMessage, cancellationToken);
        await db.SaveChangesAsync(cancellationToken);

        return new ChatTurnResponse(
            ToMessageDto(userMessage),
            ToMessageDto(assistantMessage, ragResult.WebSources));
    }

    public async Task DeleteSessionAsync(
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetRequiredUserId();
        var session = await GetActiveSessionForUserAsync(sessionId, userId, cancellationToken);
        await workspacePermissionService.EnsureCanViewWorkspaceAsync(session.WorkspaceId, userId, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        session.DeletedAt = now;
        session.UpdatedAt = now;
        await db.SaveChangesAsync(cancellationToken);
    }

    private async Task<ChatSession> GetActiveSessionForUserAsync(
        Guid sessionId,
        Guid userId,
        CancellationToken cancellationToken)
    {
        var session = await db.ChatSessions
            .FirstOrDefaultAsync(candidate => candidate.Id == sessionId
                && candidate.CreatedById == userId
                && candidate.DeletedAt == null,
                cancellationToken);

        if (session is null)
        {
            throw new ApiException(
                StatusCodes.Status404NotFound,
                "chat.session_not_found",
                "Chat session not found.");
        }

        return session;
    }

    private async Task<IReadOnlyList<RagChatHistoryMessage>> GetChatHistoryAsync(
        ChatSession session,
        CancellationToken cancellationToken)
    {
        var messages = await db.ChatMessages
            .AsNoTracking()
            .Where(message => message.ChatSessionId == session.Id
                && message.WorkspaceId == session.WorkspaceId
                && message.Role != ChatMessageRole.System)
            .OrderByDescending(message => message.CreatedAt)
            .Take(ChatHistoryMessageLimit)
            .OrderBy(message => message.CreatedAt)
            .Select(message => new
            {
                message.Role,
                message.Content
            })
            .ToListAsync(cancellationToken);

        return messages
            .Select(message => new RagChatHistoryMessage(
                ToAiChatRole(message.Role),
                message.Content))
            .ToList();
    }

    private async Task<ResolvedRagScope> ResolveScopeAsync(
        Guid workspaceId,
        IReadOnlyList<ChatMessageContextRequestDto>? requestedContexts,
        CancellationToken cancellationToken)
    {
        if (requestedContexts is null || requestedContexts.Count == 0)
        {
            return new ResolvedRagScope("workspace", null, ReportContext: null, []);
        }

        var contexts = new List<ResolvedContext>();
        var documentIds = new HashSet<Guid>();
        var contextKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var contextOrder = 0;
        string? reportContext = null;

        foreach (var request in requestedContexts)
        {
            if (request.ContextType == ApiChatContextType.Folder)
            {
                var folderContext = await ResolveFolderContextAsync(
                    workspaceId,
                    request,
                    contextOrder,
                    cancellationToken);

                if (contextKeys.Add($"folder:{folderContext.Context.FolderId}"))
                {
                    contexts.Add(folderContext.Context);
                    contextOrder++;
                }

                foreach (var documentId in folderContext.DocumentIds)
                {
                    documentIds.Add(documentId);
                }

                continue;
            }

            if (request.ContextType == ApiChatContextType.Document)
            {
                var documentContext = await ResolveDocumentContextAsync(
                    workspaceId,
                    request,
                    contextOrder,
                    cancellationToken);

                if (contextKeys.Add($"document:{documentContext.DocumentId}"))
                {
                    contexts.Add(documentContext.Context);
                    contextOrder++;
                }

                documentIds.Add(documentContext.DocumentId);
                continue;
            }

            if (request.ContextType == ApiChatContextType.Report)
            {
                var reportContextResult = await ResolveReportContextAsync(
                    workspaceId,
                    request,
                    contextOrder,
                    cancellationToken);

                if (contextKeys.Add($"report:{reportContextResult.ReportId}"))
                {
                    contexts.Add(reportContextResult.Context);
                    contextOrder++;
                }

                foreach (var documentId in reportContextResult.DocumentIds)
                {
                    documentIds.Add(documentId);
                }

                reportContext = reportContextResult.ReportContext;
                continue;
            }

            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "chat.invalid_context",
                "Chat context type is invalid.");
        }

        if (documentIds.Count == 0 && string.IsNullOrWhiteSpace(reportContext))
        {
            throw new ApiException(
                StatusCodes.Status409Conflict,
                "chat.no_completed_documents",
                "Selected chat contexts do not contain completed documents.");
        }

        return new ResolvedRagScope(
            string.IsNullOrWhiteSpace(reportContext) ? "document" : "report",
            documentIds.Count == 0 ? null : documentIds.ToList(),
            reportContext,
            contexts);
    }

    private async Task<ResolvedFolderContext> ResolveFolderContextAsync(
        Guid workspaceId,
        ChatMessageContextRequestDto request,
        int contextOrder,
        CancellationToken cancellationToken)
    {
        if (!request.FolderId.HasValue || request.DocumentId.HasValue || request.ReportId.HasValue)
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "chat.invalid_context",
                "Folder context requires folderId and must omit documentId.");
        }

        var folder = await folderRepository.GetByIdInWorkspaceAsync(
            request.FolderId.Value,
            workspaceId,
            cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status404NotFound,
                "folder.not_found",
                "Folder not found.");

        var includeSubfolders = request.IncludeSubfolders ?? true;
        var folderIds = includeSubfolders
            ? await GetFolderTreeIdsAsync(workspaceId, folder.Id, cancellationToken)
            : [folder.Id];
        var folderDocuments = await documentRepository.ListActiveByFolderIdsAsync(
            workspaceId,
            folderIds,
            cancellationToken);
        var completedDocuments = await documentRepository.ListCompletedByIdsAsync(
            workspaceId,
            folderDocuments.Select(document => document.Id).Distinct().ToList(),
            cancellationToken);

        return new ResolvedFolderContext(
            new ResolvedContext(
                ChatContextType.Folder,
                folder.Id,
                DocumentId: null,
                ReportId: null,
                includeSubfolders,
                contextOrder,
                folder.Name,
                await BuildFolderPathAsync(workspaceId, folder.Id, cancellationToken)),
            completedDocuments.Select(document => document.Id).ToList());
    }

    private async Task<ResolvedDocumentContext> ResolveDocumentContextAsync(
        Guid workspaceId,
        ChatMessageContextRequestDto request,
        int contextOrder,
        CancellationToken cancellationToken)
    {
        if (!request.DocumentId.HasValue || request.FolderId.HasValue || request.ReportId.HasValue)
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "chat.invalid_context",
                "Document context requires documentId and must omit folderId.");
        }

        var documents = await documentRepository.ListCompletedByIdsAsync(
            workspaceId,
            [request.DocumentId.Value],
            cancellationToken);
        var document = documents.FirstOrDefault()
            ?? throw new ApiException(
                StatusCodes.Status409Conflict,
                "chat.document_unavailable",
                "Document context must reference a completed, active document in the workspace.");

        return new ResolvedDocumentContext(
            document.Id,
            new ResolvedContext(
                ChatContextType.Document,
                FolderId: null,
                document.Id,
                ReportId: null,
                IncludeSubfolders: false,
                contextOrder,
                document.OriginalFileName,
                await BuildDocumentPathAsync(workspaceId, document, cancellationToken)));
    }

    private async Task<ResolvedReportContext> ResolveReportContextAsync(
        Guid workspaceId,
        ChatMessageContextRequestDto request,
        int contextOrder,
        CancellationToken cancellationToken)
    {
        if (!request.ReportId.HasValue || request.FolderId.HasValue || request.DocumentId.HasValue)
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "chat.invalid_context",
                "Report context requires reportId and must omit folderId and documentId.");
        }

        var report = await db.Reports
            .AsNoTracking()
            .FirstOrDefaultAsync(candidate => candidate.Id == request.ReportId.Value
                && candidate.WorkspaceId == workspaceId
                && candidate.DeletedAt == null,
                cancellationToken)
            ?? throw new ApiException(
                StatusCodes.Status404NotFound,
                "report.not_found",
                "Report not found.");

        var documentIds = ParseReportSourceDocumentIds(report.SourceDocuments);
        return new ResolvedReportContext(
            report.Id,
            documentIds,
            BuildReportContext(report),
            new ResolvedContext(
                ChatContextType.Report,
                FolderId: null,
                DocumentId: null,
                report.Id,
                IncludeSubfolders: false,
                contextOrder,
                report.Title,
                $"Reports/{report.Title}"));
    }

    private static IReadOnlyList<Guid> ParseReportSourceDocumentIds(string sourceDocuments)
    {
        if (string.IsNullOrWhiteSpace(sourceDocuments))
        {
            return [];
        }

        try
        {
            return JsonSerializer.Deserialize<IReadOnlyList<Guid>>(sourceDocuments, JsonOptions)?
                .Where(id => id != Guid.Empty)
                .Distinct()
                .ToList() ?? [];
        }
        catch (JsonException)
        {
            return [];
        }
    }

    private static string BuildReportContext(Report report)
    {
        var title = string.IsNullOrWhiteSpace(report.Title) ? "Untitled report" : report.Title.Trim();
        var content = string.IsNullOrWhiteSpace(report.MarkdownContent)
            ? "(Report content is empty.)"
            : report.MarkdownContent.Trim();

        return $"Report: {title}\nType: {report.ReportType}\n\n{content}";
    }

    private async Task<IReadOnlyCollection<Guid>> GetFolderTreeIdsAsync(
        Guid workspaceId,
        Guid rootFolderId,
        CancellationToken cancellationToken)
    {
        var folders = await folderRepository.ListActiveByWorkspaceAsync(workspaceId, cancellationToken);
        var foldersByParentId = folders
            .Where(folder => folder.ParentFolderId.HasValue)
            .GroupBy(folder => folder.ParentFolderId!.Value)
            .ToDictionary(group => group.Key, group => group.ToList());

        var result = new List<Guid>();
        var stack = new Stack<Guid>();
        stack.Push(rootFolderId);

        while (stack.Count > 0)
        {
            var currentFolderId = stack.Pop();
            result.Add(currentFolderId);

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

    private async Task<string?> BuildDocumentPathAsync(
        Guid workspaceId,
        Document document,
        CancellationToken cancellationToken)
    {
        if (!document.FolderId.HasValue)
        {
            return document.OriginalFileName;
        }

        var folderPath = await BuildFolderPathAsync(
            workspaceId,
            document.FolderId.Value,
            cancellationToken);

        return string.IsNullOrWhiteSpace(folderPath)
            ? document.OriginalFileName
            : $"{folderPath}/{document.OriginalFileName}";
    }

    private async Task<string?> BuildFolderPathAsync(
        Guid workspaceId,
        Guid folderId,
        CancellationToken cancellationToken)
    {
        var folders = await folderRepository.ListActiveByWorkspaceAsync(workspaceId, cancellationToken);
        var foldersById = folders.ToDictionary(folder => folder.Id);
        var path = new Stack<string>();
        var currentFolderId = folderId;

        while (foldersById.TryGetValue(currentFolderId, out var folder))
        {
            path.Push(folder.Name);
            if (!folder.ParentFolderId.HasValue)
            {
                break;
            }

            currentFolderId = folder.ParentFolderId.Value;
        }

        return path.Count == 0 ? null : string.Join("/", path);
    }

    private Guid GetRequiredUserId()
    {
        return currentUserService.UserId
            ?? throw new ApiException(
                StatusCodes.Status401Unauthorized,
                "auth.unauthorized",
                "A valid authenticated user is required.");
    }

    private async Task<AiRuntimeSettings> GetAiRuntimeSettingsAsync(CancellationToken cancellationToken)
    {
        var modelName = await systemSettingReader.GetStringAsync(
            SystemSettingKeys.DefaultAiModel,
            SystemSettingKeys.DefaultAiModelFallback,
            cancellationToken);
        var webSearchEnabled = await systemSettingReader.GetBoolAsync(
            SystemSettingKeys.WebSearchEnabled,
            fallback: false,
            cancellationToken);

        return new AiRuntimeSettings(modelName, webSearchEnabled);
    }

    private static string NormalizeMessageContent(string content)
    {
        if (string.IsNullOrWhiteSpace(content))
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "chat.empty_message",
                "Message content is required.");
        }

        return content.Trim();
    }

    private static string? NormalizeTitle(string? title)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return null;
        }

        var normalized = title.Trim();
        if (normalized.Length > MaxTitleLength)
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "chat.title_too_long",
                $"Chat session title cannot exceed {MaxTitleLength} characters.");
        }

        return normalized;
    }

    private static ChatSessionDto ToSessionDto(ChatSession session)
    {
        return new ChatSessionDto(
            session.Id,
            session.WorkspaceId,
            session.Title,
            WebSearchEnabled: false,
            WebSearchProvider: null,
            session.IsPinned,
            session.CreatedAt,
            session.UpdatedAt);
    }

    private static ChatMessageDto ToMessageDto(
        ChatMessage message,
        IReadOnlyList<RagWebSourceResult>? webSources = null)
    {
        return new ChatMessageDto(
            message.Id,
            message.ChatSessionId,
            ToApiRole(message.Role),
            message.Content,
            message.ModelName,
            message.Contexts
                .OrderBy(context => context.ContextOrder)
                .Select(ToContextDto)
                .ToList(),
            message.Sources
                .OrderBy(source => source.SourceOrder)
                .Select(ToSourceDto)
                .ToList(),
            webSources?.Select(ToWebSourceDto).ToList() ?? [],
            message.CreatedAt);
    }

    private static ChatMessageContextDto ToContextDto(ChatMessageContext context)
    {
        return new ChatMessageContextDto(
            ToApiContextType(context.ContextType),
            context.FolderId,
            context.DocumentId,
            context.ReportId,
            context.IncludeSubfolders,
            context.ContextDisplayName,
            context.ContextPath);
    }

    private static ChatSourceDto ToSourceDto(ChatMessageSource source)
    {
        return new ChatSourceDto(
            source.DocumentId,
            source.DocumentChunkId,
            source.FileName,
            source.Snippet ?? string.Empty,
            source.SimilarityScore,
            TryReadIntMetadata(source.Metadata, "chunk_index"),
            TryReadIntMetadata(source.Metadata, "page_number"));
    }

    private static WebSourceDto ToWebSourceDto(RagWebSourceResult source)
    {
        return new WebSourceDto(
            source.Title,
            source.Url,
            source.Snippet,
            source.Provider);
    }

    private static ApiChatMessageRole ToApiRole(ChatMessageRole role)
    {
        return role switch
        {
            ChatMessageRole.User => ApiChatMessageRole.User,
            ChatMessageRole.Assistant => ApiChatMessageRole.Assistant,
            _ => throw new ApiException(
                StatusCodes.Status409Conflict,
                "chat.unsupported_role",
                "Chat message role is not supported by the public API.")
        };
    }

    private static string ToAiChatRole(ChatMessageRole role)
    {
        return role switch
        {
            ChatMessageRole.User => "user",
            ChatMessageRole.Assistant => "assistant",
            _ => throw new ApiException(
                StatusCodes.Status409Conflict,
                "chat.unsupported_role",
                "Chat message role is not supported by RAG chat.")
        };
    }

    private static ApiChatContextType ToApiContextType(ChatContextType contextType)
    {
        return contextType switch
        {
            ChatContextType.Folder => ApiChatContextType.Folder,
            ChatContextType.Document => ApiChatContextType.Document,
            ChatContextType.Report => ApiChatContextType.Report,
            _ => throw new ArgumentOutOfRangeException(nameof(contextType), contextType, null)
        };
    }

    private static int? TryReadIntMetadata(string? metadata, string propertyName)
    {
        if (string.IsNullOrWhiteSpace(metadata))
        {
            return null;
        }

        try
        {
            using var document = JsonDocument.Parse(metadata);
            return document.RootElement.TryGetProperty(propertyName, out var property)
                && property.ValueKind == JsonValueKind.Number
                && property.TryGetInt32(out var value)
                ? value
                : null;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static string BuildSourceMetadata(RagSourceResult source)
    {
        return JsonSerializer.Serialize(new
        {
            chunk_index = source.ChunkIndex,
            page_number = source.PageNumber,
            retrieval_debug = source.RetrievalDebug
        }, JsonOptions);
    }

    private sealed record ResolvedRagScope(
        string Scope,
        IReadOnlyList<Guid>? DocumentIds,
        string? ReportContext,
        IReadOnlyList<ResolvedContext> Contexts);

    private sealed record ResolvedContext(
        ChatContextType ContextType,
        Guid? FolderId,
        Guid? DocumentId,
        Guid? ReportId,
        bool IncludeSubfolders,
        int ContextOrder,
        string? ContextDisplayName,
        string? ContextPath);

    private sealed record ResolvedFolderContext(
        ResolvedContext Context,
        IReadOnlyList<Guid> DocumentIds);

    private sealed record ResolvedDocumentContext(
        Guid DocumentId,
        ResolvedContext Context);

    private sealed record ResolvedReportContext(
        Guid ReportId,
        IReadOnlyList<Guid> DocumentIds,
        string ReportContext,
        ResolvedContext Context);

    private sealed record AiRuntimeSettings(
        string ModelName,
        bool WebSearchEnabled);
}
