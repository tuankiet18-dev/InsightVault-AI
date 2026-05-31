namespace InsightVault.API.Infrastructure.Storage;

public sealed class ObjectStorageOptions
{
    public string Endpoint { get; set; } = "localhost:9000";
    public string? PublicEndpoint { get; set; }
    public string AccessKey { get; set; } = "admin";
    public string SecretKey { get; set; } = "password123";
    public string BucketName { get; set; } = "insightvault-documents";
    public int PresignedUploadMinutes { get; set; } = 10;
    public bool UseSsl { get; set; }
}
