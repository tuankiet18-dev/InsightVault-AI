namespace InsightVault.API.Infrastructure.Messaging;

public sealed class RabbitMqOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string Username { get; set; } = "admin";
    public string Password { get; set; } = "password123";
    public string DocumentProcessingQueue { get; set; } = "document-processing";
}
