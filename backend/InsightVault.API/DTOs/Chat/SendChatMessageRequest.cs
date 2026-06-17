using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Chat;

public sealed record SendChatMessageRequest(
    string Content,
    IReadOnlyList<ChatMessageContextRequestDto>? Contexts = null,
    WebSearchOptionsDto? WebSearchOptions = null);

public sealed record ChatMessageContextRequestDto(
    ApiChatContextType ContextType,
    Guid? FolderId,
    Guid? DocumentId,
    Guid? ReportId,
    bool? IncludeSubfolders);
