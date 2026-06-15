namespace InsightVault.API.Application.Abstractions.Storage;

public interface IObjectStorageService
{
    string DefaultBucketName { get; }

    TimeSpan DefaultPresignedUploadExpiry { get; }

    TimeSpan DefaultPresignedReadExpiry { get; }

    Task<PresignedUpload> CreatePresignedUploadAsync(
        PresignedUploadRequest request,
        CancellationToken cancellationToken = default);

    Task<PresignedDownload> CreatePresignedDownloadAsync(
        PresignedDownloadRequest request,
        CancellationToken cancellationToken = default);

    Task<string> ReadObjectAsTextAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default);

    Task<StoredObjectMetadata?> GetObjectMetadataAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default);

    Task DeleteObjectIfExistsAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default);

    Task DeleteObjectAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default);
}

public sealed record PresignedUploadRequest(
    string BucketName,
    string ObjectKey,
    string ContentType,
    TimeSpan ExpiresIn);

public sealed record PresignedUpload(
    string UploadUrl,
    DateTimeOffset ExpiresAt,
    IReadOnlyDictionary<string, string> RequiredHeaders);

public sealed record PresignedDownloadRequest(
    string BucketName,
    string ObjectKey,
    TimeSpan ExpiresIn);

public sealed record PresignedDownload(
    string DownloadUrl,
    DateTimeOffset ExpiresAt);

public sealed record StoredObjectMetadata(
    long Size,
    string? ContentType);
