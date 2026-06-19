using System.Text;
using System.Text.Json;
using InsightVault.API.Application.Abstractions.Ai;
using InsightVault.API.Application.Abstractions.Services.SystemSettings;
using InsightVault.API.Application.Services.Reports;
using InsightVault.API.Application.Services.SystemSettings;
using InsightVault.API.Data;
using InsightVault.API.Domain.Entities;
using InsightVault.API.Domain.Enums;
using InsightVault.API.Infrastructure.Messaging;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace InsightVault.API.Infrastructure.BackgroundJobs;

public sealed class AiJobWorker(
    IServiceScopeFactory scopeFactory,
    IOptions<RabbitMqOptions> options,
    ILogger<AiJobWorker> logger) : BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var rabbitMqOptions = options.Value;
        await using var connection = await CreateConnectionAsync(rabbitMqOptions, stoppingToken);
        await using var channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);

        await channel.QueueDeclareAsync(
            queue: rabbitMqOptions.AiJobsQueue,
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
            queue: rabbitMqOptions.AiJobsQueue,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken);

        logger.LogInformation(
            "AI job worker is consuming queue {QueueName}",
            rabbitMqOptions.AiJobsQueue);

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
            logger.LogWarning(exception, "Discarding invalid AI job message");
            await channel.BasicAckAsync(
                deliveryTag: eventArgs.DeliveryTag,
                multiple: false,
                cancellationToken: cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "AI job message failed");
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
        var systemSettingReader = scope.ServiceProvider.GetRequiredService<ISystemSettingReader>();

        var job = await db.AiJobs.FirstOrDefaultAsync(
            candidate => candidate.Id == jobId,
            cancellationToken);

        if (job is null)
        {
            logger.LogWarning("AI job {JobId} was not found", jobId);
            return;
        }

        if (job.JobType is not (AiJobType.GenerateReport or AiJobType.CompareDocuments))
        {
            logger.LogWarning("AI job {JobId} has unsupported type {JobType}", jobId, job.JobType);
            return;
        }

        if (job.Status != AiJobStatus.Queued)
        {
            logger.LogInformation(
                "Skipping AI job {JobId} because status is {Status}",
                jobId,
                job.Status);
            return;
        }

        await MarkProcessingAsync(db, job, cancellationToken);

        try
        {
            var payload = DeserializePayload(job.InputPayload);
            var modelName = await systemSettingReader.GetStringAsync(
                SystemSettingKeys.DefaultAiModel,
                SystemSettingKeys.DefaultAiModelFallback,
                cancellationToken);

            if (job.JobType == AiJobType.GenerateReport)
            {
                await ProcessGenerateReportJobAsync(db, aiServiceClient, job, payload, modelName, cancellationToken);
                return;
            }

            await ProcessCompareJobAsync(db, aiServiceClient, job, payload, modelName, cancellationToken);
        }
        catch (Exception exception)
        {
            await MarkFailedAsync(db, job, exception.Message, cancellationToken);
            throw;
        }
    }

    private static AiJobMessage DeserializeMessage(ReadOnlyMemory<byte> body)
    {
        var json = Encoding.UTF8.GetString(body.Span);
        return JsonSerializer.Deserialize<AiJobMessage>(json, JsonOptions)
            ?? throw new JsonException("RabbitMQ AI job message is empty.");
    }

    private static ReportJobPayload DeserializePayload(string inputPayload)
    {
        return JsonSerializer.Deserialize<ReportJobPayload>(inputPayload, JsonOptions)
            ?? throw new JsonException("AI job input payload is empty.");
    }

    private static async Task ProcessGenerateReportJobAsync(
        InsightVaultDbContext db,
        IAiServiceClient aiServiceClient,
        AiJob job,
        ReportJobPayload payload,
        string modelName,
        CancellationToken cancellationToken)
    {
        var reportType = ReportService.ParseReportTypeRequired(
            payload.ReportType ?? "summary_report");
        var result = await aiServiceClient.GenerateReportAsync(
            new GenerateReportAiRequest(
                payload.WorkspaceId,
                payload.FolderId,
                payload.CreatedById,
                job.Id,
                payload.DocumentIds,
                ReportService.ToApiReportTypeString(reportType),
                payload.Title,
                payload.CustomPrompt,
                StoreReport: false,
                ModelName: modelName),
            cancellationToken);

        var structuredResult = JsonSerializer.Serialize(new
        {
            reportType = result.ReportType
        }, JsonOptions);
        var report = CreateReport(
            db,
            job,
            payload,
            reportType,
            result.MarkdownContent,
            structuredResult,
            payload.Title ?? DefaultReportTitle(reportType, payload.DocumentNames));

        await db.Reports.AddAsync(report, cancellationToken);
        await MarkCompletedAsync(
            db,
            job,
            JsonSerializer.Serialize(new
            {
                reportId = report.Id,
                reportType = result.ReportType
            }, JsonOptions),
            cancellationToken);
    }

    private static async Task ProcessCompareJobAsync(
        InsightVaultDbContext db,
        IAiServiceClient aiServiceClient,
        AiJob job,
        ReportJobPayload payload,
        string modelName,
        CancellationToken cancellationToken)
    {
        var result = await aiServiceClient.CompareDocumentsAsync(
            new CompareDocumentsAiRequest(
                payload.WorkspaceId,
                payload.FolderId,
                payload.CreatedById,
                job.Id,
                payload.DocumentIds,
                payload.DocumentNames,
                payload.Title,
                StoreReport: false,
                ModelName: modelName),
            cancellationToken);

        var structuredResult = JsonSerializer.Serialize(new
        {
            result.Objectives,
            result.Scope,
            result.Similarities,
            result.Differences,
            result.MissingInformation,
            result.PotentialConflicts,
            result.Recommendations
        }, JsonOptions);
        var report = CreateReport(
            db,
            job,
            payload,
            ReportType.ComparisonReport,
            result.RawMarkdown,
            structuredResult,
            payload.Title ?? $"Comparison Report - {payload.DocumentNames.Count} documents");

        await db.Reports.AddAsync(report, cancellationToken);
        await MarkCompletedAsync(
            db,
            job,
            JsonSerializer.Serialize(new
            {
                reportId = report.Id,
                result.Objectives,
                result.Scope
            }, JsonOptions),
            cancellationToken);
    }

    private static Report CreateReport(
        InsightVaultDbContext db,
        AiJob job,
        ReportJobPayload payload,
        ReportType reportType,
        string markdownContent,
        string structuredResult,
        string title)
    {
        var now = DateTimeOffset.UtcNow;
        var reportGroupId = payload.ReportGroupId ?? Guid.NewGuid();
        var nextVersionNumber = ReportVersioning.GetNextVersionNumber(
            db.Reports,
            payload.WorkspaceId,
            reportGroupId);

        return new Report
        {
            Id = Guid.NewGuid(),
            WorkspaceId = payload.WorkspaceId,
            FolderId = payload.FolderId,
            CreatedById = payload.CreatedById,
            AiJobId = job.Id,
            ReportGroupId = reportGroupId,
            VersionNumber = nextVersionNumber,
            Title = title,
            ReportType = reportType,
            MarkdownContent = markdownContent,
            SourceDocuments = JsonSerializer.Serialize(
                payload.DocumentIds.Select(documentId => documentId.ToString()).ToList(),
                JsonOptions),
            StructuredResult = structuredResult,
            CreatedAt = now,
            UpdatedAt = now
        };
    }

    private static string DefaultReportTitle(
        ReportType reportType,
        IReadOnlyList<string> documentNames)
    {
        var documentLabel = documentNames.Count == 1 ? documentNames[0] : $"{documentNames.Count} documents";
        return $"{ReportService.ToApiReportTypeString(reportType).Replace('_', ' ')} - {documentLabel}";
    }

    private static async Task MarkProcessingAsync(
        InsightVaultDbContext db,
        AiJob job,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        job.Status = AiJobStatus.Processing;
        job.StartedAt = now;
        job.UpdatedAt = now;
        job.ErrorMessage = null;

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task MarkCompletedAsync(
        InsightVaultDbContext db,
        AiJob job,
        string outputPayload,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        job.Status = AiJobStatus.Completed;
        job.OutputPayload = outputPayload;
        job.CompletedAt = now;
        job.UpdatedAt = now;
        job.ErrorMessage = null;

        await db.SaveChangesAsync(cancellationToken);
    }

    private static async Task MarkFailedAsync(
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
