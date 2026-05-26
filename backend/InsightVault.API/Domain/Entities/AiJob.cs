using InsightVault.API.Domain.Enums;

namespace InsightVault.API.Domain.Entities;

public sealed class AiJob
{
    public Guid Id { get; set; }
    public Guid? WorkspaceId { get; set; }
    public Guid? DocumentId { get; set; }
    public Guid? CreatedById { get; set; }
    public AiJobType JobType { get; set; }
    public AiJobStatus Status { get; set; } = AiJobStatus.Queued;
    public string InputPayload { get; set; } = "{}";
    public string OutputPayload { get; set; } = "{}";
    public string? ErrorMessage { get; set; }
    public int RetryCount { get; set; }
    public DateTimeOffset? StartedAt { get; set; }
    public DateTimeOffset? CompletedAt { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Workspace? Workspace { get; set; }
    public Document? Document { get; set; }
    public User? CreatedBy { get; set; }
    public List<Report> Reports { get; set; } = [];
}
