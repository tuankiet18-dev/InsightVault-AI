using System.Text;
using System.Text.Json;
using InsightVault.API.Application.Abstractions.Messaging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;

namespace InsightVault.API.Infrastructure.Messaging;

public sealed class RabbitMqMessagePublisher(
    IOptions<RabbitMqOptions> options) : IMessagePublisher
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task PublishDocumentProcessingJobAsync(
        Guid jobId,
        CancellationToken cancellationToken = default)
    {
        await PublishAsync(
            options.Value.DocumentProcessingQueue,
            new DocumentProcessingMessage(jobId),
            cancellationToken);
    }

    public async Task PublishAiJobAsync(
        Guid jobId,
        CancellationToken cancellationToken = default)
    {
        await PublishAsync(
            options.Value.AiJobsQueue,
            new AiJobMessage(jobId),
            cancellationToken);
    }

    private async Task PublishAsync<TMessage>(
        string queueName,
        TMessage message,
        CancellationToken cancellationToken)
    {
        var rabbitMqOptions = options.Value;
        await using var connection = await CreateConnectionAsync(rabbitMqOptions, cancellationToken);
        await using var channel = await connection.CreateChannelAsync(cancellationToken: cancellationToken);

        await channel.QueueDeclareAsync(
            queue: queueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null,
            cancellationToken: cancellationToken);

        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message, JsonOptions));
        var properties = new BasicProperties
        {
            ContentType = "application/json",
            DeliveryMode = DeliveryModes.Persistent
        };

        await channel.BasicPublishAsync(
            exchange: string.Empty,
            routingKey: queueName,
            mandatory: false,
            basicProperties: properties,
            body: body,
            cancellationToken: cancellationToken);
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
