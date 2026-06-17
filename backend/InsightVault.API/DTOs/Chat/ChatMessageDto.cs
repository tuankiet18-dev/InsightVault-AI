using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Chat;

public sealed record ChatMessageDto(
    Guid Id,
    Guid ChatSessionId,
    ApiChatMessageRole Role,
    string Content,
    string? ModelName,
    IReadOnlyList<ChatMessageContextDto> Contexts,
    IReadOnlyList<ChatSourceDto> Sources,
    IReadOnlyList<WebSourceDto>? WebSources,
    DateTimeOffset CreatedAt);

public sealed record ChatMessageContextDto(
    ApiChatContextType ContextType,
    Guid? FolderId,
    Guid? DocumentId,
    Guid? ReportId,
    bool IncludeSubfolders,
    string? ContextDisplayName,
    string? ContextPath);
