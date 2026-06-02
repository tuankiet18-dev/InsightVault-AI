namespace InsightVault.API.Application.Abstractions.Storage;

public interface IObjectStorageService
{
    string DefaultBucketName { get; }

    TimeSpan DefaultPresignedUploadExpiry { get; }

    Task<PresignedUpload> CreatePresignedUploadAsync(
        PresignedUploadRequest request,
        CancellationToken cancellationToken = default);

    Task DeleteObjectIfExistsAsync(
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
