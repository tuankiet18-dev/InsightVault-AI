using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Domain.Entities;

public sealed class Report
{
    public Guid Id { get; set; }
    public Guid WorkspaceId { get; set; }
    public Guid? FolderId { get; set; }
    public Guid? CreatedById { get; set; }
    public Guid? AiJobId { get; set; }
    public Guid ReportGroupId { get; set; }
    public int VersionNumber { get; set; } = 1;
    public string Title { get; set; } = string.Empty;
    public ReportType ReportType { get; set; }
    public string MarkdownContent { get; set; } = string.Empty;
    public string SourceDocuments { get; set; } = "[]";
    public string StructuredResult { get; set; } = "{}";
    public string? ModelName { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }
    public DateTimeOffset? DeletedAt { get; set; }

    public bool IsPublic { get; set; }
    public string? PublicToken { get; set; }
    public DateTimeOffset? SharedExpiresAt { get; set; }

    public Workspace Workspace { get; set; } = null!;
    public Folder? Folder { get; set; }
    public User? CreatedBy { get; set; }
    public AiJob? AiJob { get; set; }
}
