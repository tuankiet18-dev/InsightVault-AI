namespace InsightVault.API.Infrastructure.Messaging;

public sealed record DocumentProcessingMessage(Guid JobId);

public sealed record AiJobMessage(Guid JobId);
