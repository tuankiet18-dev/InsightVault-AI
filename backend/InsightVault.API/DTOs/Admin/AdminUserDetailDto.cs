using InsightVault.API.DTOs.Auth;

namespace InsightVault.API.DTOs.Admin;

public sealed record AdminUserDetailDto(
    UserDto User,
    int OwnedWorkspaceCount,
    int MemberWorkspaceCount,
    int UploadedDocumentCount,
    long StorageBytes,
    int AiCreditsRemaining,
    int PaymentOrderCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);
