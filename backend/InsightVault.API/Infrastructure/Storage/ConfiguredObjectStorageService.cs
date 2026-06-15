using InsightVault.API.Application.Abstractions.Storage;
using Microsoft.Extensions.Options;
using Minio;
using Minio.Exceptions;
using Minio.DataModel.Args;

namespace InsightVault.API.Infrastructure.Storage;

public sealed class ConfiguredObjectStorageService(
    IOptions<ObjectStorageOptions> options,
    ILogger<ConfiguredObjectStorageService> logger) : IObjectStorageService
{
    public string DefaultBucketName => options.Value.BucketName;

    public TimeSpan DefaultPresignedUploadExpiry => TimeSpan.FromMinutes(options.Value.PresignedUploadMinutes);

    public TimeSpan DefaultPresignedReadExpiry => TimeSpan.FromMinutes(options.Value.PresignedReadMinutes);

    public async Task<PresignedUpload> CreatePresignedUploadAsync(
        PresignedUploadRequest request,
        CancellationToken cancellationToken = default)
    {
        var storageOptions = options.Value;
        var requiredHeaders = new Dictionary<string, string>
        {
            ["Content-Type"] = request.ContentType
        };
        var minioClient = CreateClient(storageOptions, storageOptions.Endpoint);

        await EnsureBucketExistsAsync(minioClient, request.BucketName, cancellationToken);

        var presignEndpoint = string.IsNullOrWhiteSpace(storageOptions.PublicEndpoint)
            ? storageOptions.Endpoint
            : storageOptions.PublicEndpoint;
        var presignClient = CreateClient(storageOptions, presignEndpoint);
        var presignedArgs = new PresignedPutObjectArgs()
            .WithBucket(request.BucketName)
            .WithObject(request.ObjectKey)
            .WithExpiry((int)request.ExpiresIn.TotalSeconds)
            .WithHeaders(requiredHeaders);
        var uploadUrl = await presignClient.PresignedPutObjectAsync(presignedArgs);
        var expiresAt = DateTimeOffset.UtcNow.Add(request.ExpiresIn);

        return new PresignedUpload(uploadUrl, expiresAt, requiredHeaders);
    }

    public async Task<PresignedDownload> CreatePresignedDownloadAsync(
        PresignedDownloadRequest request,
        CancellationToken cancellationToken = default)
    {
        var storageOptions = options.Value;
        var minioClient = CreateClient(storageOptions, storageOptions.Endpoint);

        await EnsureBucketExistsAsync(minioClient, request.BucketName, cancellationToken);

        var presignEndpoint = string.IsNullOrWhiteSpace(storageOptions.PublicEndpoint)
            ? storageOptions.Endpoint
            : storageOptions.PublicEndpoint;
        var presignClient = CreateClient(storageOptions, presignEndpoint);
        var presignedArgs = new PresignedGetObjectArgs()
            .WithBucket(request.BucketName)
            .WithObject(request.ObjectKey)
            .WithExpiry((int)request.ExpiresIn.TotalSeconds);
        var downloadUrl = await presignClient.PresignedGetObjectAsync(presignedArgs);
        var expiresAt = DateTimeOffset.UtcNow.Add(request.ExpiresIn);

        return new PresignedDownload(downloadUrl, expiresAt);
    }

    public async Task<string> ReadObjectAsTextAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        var minioClient = CreateClient(options.Value, options.Value.Endpoint);
        await using var memoryStream = new MemoryStream();
        var getArgs = new GetObjectArgs()
            .WithBucket(bucketName)
            .WithObject(objectKey)
            .WithCallbackStream(stream => stream.CopyTo(memoryStream));

        await minioClient.GetObjectAsync(getArgs, cancellationToken);
        memoryStream.Position = 0;
        using var reader = new StreamReader(memoryStream);

        return await reader.ReadToEndAsync(cancellationToken);
    }

    public async Task DeleteObjectIfExistsAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var minioClient = CreateClient(options.Value, options.Value.Endpoint);
            var removeArgs = new RemoveObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey);

            await minioClient.RemoveObjectAsync(removeArgs, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogWarning(
                exception,
                "Failed to delete object {ObjectKey} from bucket {BucketName}",
                objectKey,
                bucketName);
        }
    }

    public async Task DeleteObjectAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var minioClient = CreateClient(options.Value, options.Value.Endpoint);
            var removeArgs = new RemoveObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey);

            await minioClient.RemoveObjectAsync(removeArgs, cancellationToken);
        }
        catch (ObjectNotFoundException)
        {
        }
        catch (BucketNotFoundException)
        {
        }
    }

    public async Task<StoredObjectMetadata?> GetObjectMetadataAsync(
        string bucketName,
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var minioClient = CreateClient(options.Value, options.Value.Endpoint);
            var statArgs = new StatObjectArgs()
                .WithBucket(bucketName)
                .WithObject(objectKey);
            var objectStat = await minioClient.StatObjectAsync(statArgs, cancellationToken);

            return new StoredObjectMetadata(objectStat.Size, objectStat.ContentType);
        }
        catch (ObjectNotFoundException)
        {
            return null;
        }
        catch (BucketNotFoundException)
        {
            return null;
        }
    }

    private static IMinioClient CreateClient(ObjectStorageOptions storageOptions, string endpoint)
    {
        var builder = new MinioClient()
            .WithEndpoint(endpoint)
            .WithCredentials(storageOptions.AccessKey, storageOptions.SecretKey);

        if (storageOptions.UseSsl)
        {
            builder = builder.WithSSL();
        }

        return builder.Build();
    }

    private static async Task EnsureBucketExistsAsync(
        IMinioClient minioClient,
        string bucketName,
        CancellationToken cancellationToken)
    {
        var existsArgs = new BucketExistsArgs().WithBucket(bucketName);

        if (await minioClient.BucketExistsAsync(existsArgs, cancellationToken))
        {
            return;
        }

        var makeBucketArgs = new MakeBucketArgs().WithBucket(bucketName);
        await minioClient.MakeBucketAsync(makeBucketArgs, cancellationToken);
    }
}
