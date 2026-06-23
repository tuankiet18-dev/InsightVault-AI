using System.Text.Json;
using InsightVault.API.Application.Abstractions.Messaging;
using InsightVault.API.Infrastructure.Emails;
using InsightVault.API.Infrastructure.Messaging;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using MimeKit.Text;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace InsightVault.API.Infrastructure.BackgroundJobs;

public sealed class EmailWorker(
    IOptions<RabbitMqOptions> rabbitMqOptions,
    IOptions<SmtpOptions> smtpOptions,
    ILogger<EmailWorker> logger) : BackgroundService
{
    private const string RetryHeader = "x-email-delivery-attempt";
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!smtpOptions.Value.Enabled)
        {
            logger.LogInformation("Email worker is disabled.");
            return;
        }

        var reconnectDelay = TimeSpan.FromSeconds(1);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ConsumeEmailsAsync(stoppingToken);
                reconnectDelay = TimeSpan.FromSeconds(1);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception exception)
            {
                logger.LogWarning(
                    exception,
                    "Email worker lost its RabbitMQ connection. Retrying in {DelaySeconds} seconds.",
                    reconnectDelay.TotalSeconds);

                await Task.Delay(reconnectDelay, stoppingToken);
                reconnectDelay = TimeSpan.FromSeconds(Math.Min(reconnectDelay.TotalSeconds * 2, 30));
            }
        }
    }

    private async Task ConsumeEmailsAsync(CancellationToken stoppingToken)
    {
        var options = rabbitMqOptions.Value;
        var deadLetterQueue = $"{options.EmailQueue}.dead-letter";
        var factory = new ConnectionFactory
        {
            HostName = options.Host,
            Port = options.Port,
            UserName = options.Username,
            Password = options.Password,
            AutomaticRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(5)
        };

        await using var connection = await factory.CreateConnectionAsync(stoppingToken);
        await using var channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);

        await DeclareQueueAsync(channel, options.EmailQueue, stoppingToken);
        await DeclareQueueAsync(channel, deadLetterQueue, stoppingToken);

        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += async (_, eventArgs) =>
        {
            await HandleMessageAsync(
                channel,
                eventArgs,
                options,
                deadLetterQueue,
                stoppingToken);
        };

        await channel.BasicConsumeAsync(
            queue: options.EmailQueue,
            autoAck: false,
            consumer: consumer,
            cancellationToken: stoppingToken);

        logger.LogInformation("Email worker is consuming queue {QueueName}.", options.EmailQueue);

        while (connection.IsOpen && channel.IsOpen && !stoppingToken.IsCancellationRequested)
        {
            await Task.Delay(TimeSpan.FromSeconds(5), stoppingToken);
        }

        if (!stoppingToken.IsCancellationRequested)
        {
            throw new InvalidOperationException("RabbitMQ closed the email consumer connection.");
        }
    }

    private async Task HandleMessageAsync(
        IChannel channel,
        BasicDeliverEventArgs eventArgs,
        RabbitMqOptions options,
        string deadLetterQueue,
        CancellationToken stoppingToken)
    {
        try
        {
            var message = JsonSerializer.Deserialize<EmailMessage>(eventArgs.Body.Span, JsonOptions)
                ?? throw new JsonException("Email message payload is empty.");

            await SendEmailAsync(message, stoppingToken);
            await channel.BasicAckAsync(
                eventArgs.DeliveryTag,
                multiple: false,
                cancellationToken: stoppingToken);
        }
        catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception exception)
        {
            var attempt = ReadDeliveryAttempt(eventArgs.BasicProperties.Headers) + 1;
            var targetQueue = attempt >= options.EmailMaxDeliveryAttempts
                ? deadLetterQueue
                : options.EmailQueue;

            logger.LogWarning(
                exception,
                "Email delivery attempt {Attempt}/{MaxAttempts} failed. Moving message to {QueueName}.",
                attempt,
                options.EmailMaxDeliveryAttempts,
                targetQueue);

            if (targetQueue == options.EmailQueue)
            {
                await Task.Delay(TimeSpan.FromSeconds(options.EmailRetryDelaySeconds), stoppingToken);
            }

            await RepublishAsync(channel, targetQueue, eventArgs, attempt, stoppingToken);
            await channel.BasicAckAsync(
                eventArgs.DeliveryTag,
                multiple: false,
                cancellationToken: stoppingToken);
        }
    }

    private static async Task DeclareQueueAsync(
        IChannel channel,
        string queueName,
        CancellationToken cancellationToken)
    {
        await channel.QueueDeclareAsync(
            queue: queueName,
            durable: true,
            exclusive: false,
            autoDelete: false,
            arguments: null,
            cancellationToken: cancellationToken);
    }

    private static async Task RepublishAsync(
        IChannel channel,
        string queueName,
        BasicDeliverEventArgs eventArgs,
        int attempt,
        CancellationToken cancellationToken)
    {
        var headers = eventArgs.BasicProperties.Headers is null
            ? new Dictionary<string, object?>()
            : new Dictionary<string, object?>(eventArgs.BasicProperties.Headers);
        headers[RetryHeader] = attempt;

        var properties = new BasicProperties
        {
            ContentType = eventArgs.BasicProperties.ContentType ?? "application/json",
            DeliveryMode = DeliveryModes.Persistent,
            Headers = headers
        };

        await channel.BasicPublishAsync(
            exchange: string.Empty,
            routingKey: queueName,
            mandatory: false,
            basicProperties: properties,
            body: eventArgs.Body,
            cancellationToken: cancellationToken);
    }

    private static int ReadDeliveryAttempt(IDictionary<string, object?>? headers)
    {
        if (headers is null || !headers.TryGetValue(RetryHeader, out var value) || value is null)
        {
            return 0;
        }

        return value switch
        {
            byte[] bytes when int.TryParse(System.Text.Encoding.UTF8.GetString(bytes), out var parsed) => parsed,
            _ when int.TryParse(Convert.ToString(value), out var parsed) => parsed,
            _ => 0
        };
    }

    private async Task SendEmailAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        var smtp = smtpOptions.Value;
        var mimeMessage = new MimeMessage();
        mimeMessage.From.Add(new MailboxAddress(smtp.SenderName, smtp.SenderEmail));
        mimeMessage.To.Add(MailboxAddress.Parse(message.ToEmail));
        mimeMessage.Subject = message.Subject;
        mimeMessage.Body = new TextPart(TextFormat.Html) { Text = message.HtmlBody };

        using var client = new SmtpClient();
        var secureSocketOptions = smtp.UseSsl
            ? SecureSocketOptions.StartTls
            : SecureSocketOptions.Auto;

        await client.ConnectAsync(smtp.Host, smtp.Port, secureSocketOptions, cancellationToken);

        if (!string.IsNullOrEmpty(smtp.Username))
        {
            await client.AuthenticateAsync(smtp.Username, smtp.Password, cancellationToken);
        }

        await client.SendAsync(mimeMessage, cancellationToken);
        await client.DisconnectAsync(true, cancellationToken);

        logger.LogInformation("Sent email to {Email} with subject {Subject}.", message.ToEmail, message.Subject);
    }
}
