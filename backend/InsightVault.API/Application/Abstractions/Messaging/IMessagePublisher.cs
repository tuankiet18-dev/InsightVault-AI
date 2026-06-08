namespace InsightVault.API.Application.Abstractions.Messaging;

public interface IMessagePublisher
{
    Task PublishDocumentProcessingJobAsync(
        Guid jobId,
        CancellationToken cancellationToken = default);

    Task PublishAiJobAsync(
        Guid jobId,
        CancellationToken cancellationToken = default);
}
