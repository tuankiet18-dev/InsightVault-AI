namespace InsightVault.API.Infrastructure.Messaging;

public sealed class RabbitMqOptions
{
    public string Host { get; set; } = "localhost";
    public int Port { get; set; } = 5672;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string DocumentProcessingQueue { get; set; } = "document-processing";
    public string AiJobsQueue { get; set; } = "ai-jobs";
    public string EmailQueue { get; set; } = "emails";
}
