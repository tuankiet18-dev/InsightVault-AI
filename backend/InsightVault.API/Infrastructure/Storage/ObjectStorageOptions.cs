namespace InsightVault.API.Infrastructure.Storage;

public sealed class ObjectStorageOptions
{
    public string Endpoint { get; set; } = "localhost:9000";
    public string? PublicEndpoint { get; set; }
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string BucketName { get; set; } = "insightvault-documents";
    public int PresignedUploadMinutes { get; set; } = 10;
    public int PresignedReadMinutes { get; set; } = 10;
    public bool UseSsl { get; set; }
    public bool? PublicUseSsl { get; set; }
}
