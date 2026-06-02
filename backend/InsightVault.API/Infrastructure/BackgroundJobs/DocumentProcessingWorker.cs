using System.Text;
using System.Text.Json;
using InsightVault.API.Application.Abstractions.Ai;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.Infrastructure.Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace InsightVault.API.Infrastructure.BackgroundJobs;

public sealed class DocumentProcessingWorker(
    IServiceScopeFactory scopeFactory,
    IOptions<RabbitMqOptions> options,
    ILogger<DocumentProcessingWorker> logger) : BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var rabbitMqOptions = options.Value;
        await using var connection = await CreateConnectionAsync(rabbitMqOptions, stoppingToken);
        await using var channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);

        await channel.QueueDeclareAsync(
            queue: rabbitMqOptions.DocumentProcessingQueue,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null,
            cancellationToken: stoppingToken);
        await channel.BasicQosAsync(
            prefetchSize: 0,
            prefetchCount: 1,
            global: false,
            cancellationToken: stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += async (_, eventArgs) =>
        {
            await HandleMessageAsync(channel, eventArgs, stoppingToken);
        };

        await channel.BasicConsumeAsync(
            queue: rabbitMqOptions.DocumentProcessingQueue,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken);

        logger.LogInformation(
            "Document processing worker is consuming queue {QueueName}",
            rabbitMqOptions.DocumentProcessingQueue);

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task HandleMessageAsync(
        IChannel channel,
        BasicDeliverEventArgs eventArgs,
        CancellationToken cancellationToken)
    {
        try
        {
            var message = DeserializeMessage(eventArgs.Body);
            await ProcessJobAsync(message.JobId, cancellationToken);
            await channel.BasicAckAsync(
                deliveryTag: eventArgs.DeliveryTag,
                multiple: false,
                cancellationToken: cancellationToken);
        }
        catch (JsonException exception)
        {
            logger.LogWarning(exception, "Discarding invalid document processing message");
            await channel.BasicAckAsync(
                deliveryTag: eventArgs.DeliveryTag,
                multiple: false,
                cancellationToken: cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Document processing message failed");
            await channel.BasicNackAsync(
                deliveryTag: eventArgs.DeliveryTag,
                multiple: false,
                requeue: false,
                cancellationToken: cancellationToken);
        }
    }

    private async Task ProcessJobAsync(Guid jobId, CancellationToken cancellationToken)
    {
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<InsightVaultDbContext>();
        var aiServiceClient = scope.ServiceProvider.GetRequiredService<IAiServiceClient>();

        var job = await db.AiJobs
            .Include(candidate => candidate.Document)
            .FirstOrDefaultAsync(candidate => candidate.Id == jobId, cancellationToken);

        if (job is null)
        {
            logger.LogWarning("Document processing job {JobId} was not found", jobId);
            return;
        }

        if (job.JobType != AiJobType.ProcessDocument)
        {
            logger.LogWarning("Job {JobId} is not a process_document job", jobId);
            return;
        }

        if (job.Status != AiJobStatus.Queued)
        {
            logger.LogInformation(
                "Skipping job {JobId} because status is {Status}",
                jobId,
                job.Status);
            return;
        }

        if (job.Document is null || job.Document.DeletedAt is not null)
        {
            await MarkJobFailedAsync(
                db,
                job,
                "Document not found or has been deleted.",
                cancellationToken);
            return;
        }

        await MarkProcessingAsync(db, job, job.Document, cancellationToken);

        try
        {
            var result = await aiServiceClient.ProcessDocumentAsync(job.Document, cancellationToken);
            await MarkCompletedAsync(db, job, job.Document, result, cancellationToken);
        }
        catch (Exception exception)
        {
            await MarkFailedAsync(db, job, job.Document, exception.Message, cancellationToken);
            throw;
        }
    }

    private static DocumentProcessingMessage DeserializeMessage(ReadOnlyMemory<byte> body)
    {
        var json = Encoding.UTF8.GetString(body.Span);
        return JsonSerializer.Deserialize<DocumentProcessingMessage>(json, JsonOptions)
            ?? throw new JsonException("RabbitMQ document processing message is empty.");
    }

    private static async Task MarkProcessingAsync(
        InsightVaultDbContext db,
        AiJob job,
        Document document,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        job.Status = AiJobStatus.Processing;
        job.StartedAt = now;
        job.UpdatedAt = now;
        document.Status = DocumentStatus.Processing;
        document.ProcessingError = null;
        document.UpdatedAt = now;

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task MarkCompletedAsync(
        InsightVaultDbContext db,
        AiJob job,
        Document document,
        ProcessDocumentResult result,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        job.Status = AiJobStatus.Completed;
        job.OutputPayload = JsonSerializer.Serialize(result, JsonOptions);
        job.CompletedAt = now;
        job.UpdatedAt = now;
        document.Status = DocumentStatus.Completed;
        document.Summary = result.Summary;
        document.KeyPoints = JsonSerializer.Serialize(result.KeyPoints, JsonOptions);
        document.Keywords = JsonSerializer.Serialize(result.Keywords, JsonOptions);
        document.ProcessingError = result.Error;
        document.ProcessedAt = now;
        document.UpdatedAt = now;

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task MarkFailedAsync(
        InsightVaultDbContext db,
        AiJob job,
        Document document,
        string errorMessage,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        job.Status = AiJobStatus.Failed;
        job.ErrorMessage = errorMessage;
        job.CompletedAt = now;
        job.UpdatedAt = now;
        document.Status = DocumentStatus.Failed;
        document.ProcessingError = errorMessage;
        document.UpdatedAt = now;

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task MarkJobFailedAsync(
        InsightVaultDbContext db,
        AiJob job,
        string errorMessage,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        job.Status = AiJobStatus.Failed;
        job.ErrorMessage = errorMessage;
        job.CompletedAt = now;
        job.UpdatedAt = now;

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task<IConnection> CreateConnectionAsync(
        RabbitMqOptions options,
        CancellationToken cancellationToken)
    {
        var factory = new ConnectionFactory
        {
            HostName = options.Host,
            Port = options.Port,
            UserName = options.Username,
            Password = options.Password
        };

        return await factory.CreateConnectionAsync(cancellationToken);
    }
}
