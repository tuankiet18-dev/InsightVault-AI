using System.Text.Json.Serialization;

namespace InsightVault.API.DTOs.Common;

[JsonConverter(typeof(JsonStringEnumConverter<ApiSystemRole>))]
public enum ApiSystemRole
{
    [JsonStringEnumMemberName("user")]
    User,

    [JsonStringEnumMemberName("admin")]
    Admin
}

[JsonConverter(typeof(JsonStringEnumConverter<ApiWorkspaceRole>))]
public enum ApiWorkspaceRole
{
    [JsonStringEnumMemberName("owner")]
    Owner,

    [JsonStringEnumMemberName("editor")]
    Editor,

    [JsonStringEnumMemberName("viewer")]
    Viewer
}

[JsonConverter(typeof(JsonStringEnumConverter<ApiMemberStatus>))]
public enum ApiMemberStatus
{
    [JsonStringEnumMemberName("invited")]
    Invited,

    [JsonStringEnumMemberName("active")]
    Active,

    [JsonStringEnumMemberName("removed")]
    Removed
}

[JsonConverter(typeof(JsonStringEnumConverter<ApiWorkspaceInvitationStatus>))]
public enum ApiWorkspaceInvitationStatus
{
    [JsonStringEnumMemberName("pending")]
    Pending,

    [JsonStringEnumMemberName("accepted")]
    Accepted,

    [JsonStringEnumMemberName("declined")]
    Declined,

    [JsonStringEnumMemberName("expired")]
    Expired,

    [JsonStringEnumMemberName("cancelled")]
    Cancelled
}

[JsonConverter(typeof(JsonStringEnumConverter<ApiDocumentStatus>))]
public enum ApiDocumentStatus
{
    [JsonStringEnumMemberName("pending_upload")]
    PendingUpload,

    [JsonStringEnumMemberName("uploaded")]
    Uploaded,

    [JsonStringEnumMemberName("processing")]
    Processing,

    [JsonStringEnumMemberName("completed")]
    Completed,

    [JsonStringEnumMemberName("failed")]
    Failed
}

[JsonConverter(typeof(JsonStringEnumConverter<ApiAiJobType>))]
public enum ApiAiJobType
{
    [JsonStringEnumMemberName("process_document")]
    ProcessDocument,

    [JsonStringEnumMemberName("generate_summary")]
    GenerateSummary,

    [JsonStringEnumMemberName("rag_chat")]
    RagChat,

    [JsonStringEnumMemberName("generate_report")]
    GenerateReport,

    [JsonStringEnumMemberName("compare_documents")]
    CompareDocuments
}

[JsonConverter(typeof(JsonStringEnumConverter<ApiAiJobStatus>))]
public enum ApiAiJobStatus
{
    [JsonStringEnumMemberName("queued")]
    Queued,

    [JsonStringEnumMemberName("processing")]
    Processing,

    [JsonStringEnumMemberName("completed")]
    Completed,

    [JsonStringEnumMemberName("failed")]
    Failed,

    [JsonStringEnumMemberName("cancelled")]
    Cancelled
}

[JsonConverter(typeof(JsonStringEnumConverter<ApiChatContextType>))]
public enum ApiChatContextType
{
    [JsonStringEnumMemberName("folder")]
    Folder,

    [JsonStringEnumMemberName("document")]
    Document,

    [JsonStringEnumMemberName("report")]
    Report
}

[JsonConverter(typeof(JsonStringEnumConverter<ApiChatMessageRole>))]
public enum ApiChatMessageRole
{
    [JsonStringEnumMemberName("user")]
    User,

    [JsonStringEnumMemberName("assistant")]
    Assistant
}

[JsonConverter(typeof(JsonStringEnumConverter<ApiReportType>))]
public enum ApiReportType
{
    [JsonStringEnumMemberName("summary_report")]
    SummaryReport,

    [JsonStringEnumMemberName("comparison_report")]
    ComparisonReport,

    [JsonStringEnumMemberName("gap_analysis_report")]
    GapAnalysisReport,

    [JsonStringEnumMemberName("gap_conflict_report")]
    GapConflictReport,

    [JsonStringEnumMemberName("folder_report")]
    FolderReport,

    [JsonStringEnumMemberName("section_report")]
    SectionReport,

    [JsonStringEnumMemberName("custom_report")]
    CustomReport
}

[JsonConverter(typeof(JsonStringEnumConverter<ApiWebSearchProvider>))]
public enum ApiWebSearchProvider
{
    [JsonStringEnumMemberName("duckduckgo")]
    DuckDuckGo,

    [JsonStringEnumMemberName("searxng")]
    Searxng,

    [JsonStringEnumMemberName("brave")]
    Brave
}
