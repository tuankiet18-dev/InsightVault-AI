using System.Text.Json;
using InsightVault.API.Application.Abstractions.Messaging;
using InsightVault.API.Infrastructure.Emails;
using InsightVault.API.Infrastructure.Messaging;
using Microsoft.Extensions.Options;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using MimeKit.Text;

namespace InsightVault.API.Infrastructure.BackgroundJobs;

public sealed class EmailWorker(
    IOptions<RabbitMqOptions> rabbitMqOptions,
    IOptions<SmtpOptions> smtpOptions,
    ILogger<EmailWorker> logger) : BackgroundService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!smtpOptions.Value.Enabled)
        {
            logger.LogInformation("Email worker is disabled.");
            return;
        }

        var mqOptions = rabbitMqOptions.Value;

            var factory = new ConnectionFactory
            {
                HostName = mqOptions.Host,
                Port = mqOptions.Port,
                UserName = mqOptions.Username,
                Password = mqOptions.Password
            };

            await using var connection = await factory.CreateConnectionAsync(stoppingToken);
            await using var channel = await connection.CreateChannelAsync(cancellationToken: stoppingToken);

            await channel.QueueDeclareAsync(
                queue: mqOptions.EmailQueue,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: null,
                cancellationToken: stoppingToken);

            var consumer = new AsyncEventingBasicConsumer(channel);
            consumer.ReceivedAsync += async (model, ea) =>
            {
                try
                {
                    var body = ea.Body.ToArray();
                    var message = JsonSerializer.Deserialize<EmailMessage>(body, JsonOptions);

                    if (message is not null)
                    {
                        await SendEmailAsync(message, stoppingToken);
                    }

                    await channel.BasicAckAsync(ea.DeliveryTag, multiple: false, cancellationToken: stoppingToken);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Error processing email message.");
                    // In a real production system, you might want a dead-letter queue or delay here.
                    // For now we just requeue or nack
                    await Task.Delay(1000, stoppingToken); // Prevent spin loop on persistent errors
                    await channel.BasicNackAsync(ea.DeliveryTag, multiple: false, requeue: true, cancellationToken: stoppingToken);
                }
            };

            await channel.BasicConsumeAsync(
                queue: mqOptions.EmailQueue,
                autoAck: false,
                consumer: consumer,
                cancellationToken: stoppingToken);

            // Wait until cancelled
            var tcs = new TaskCompletionSource();
            stoppingToken.Register(() => tcs.SetResult());
            await tcs.Task;
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

        logger.LogInformation("Sent email to {Email} with subject {Subject}", message.ToEmail, message.Subject);
    }
}
