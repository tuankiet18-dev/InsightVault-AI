using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Workspaces;

public sealed record AddWorkspaceMemberRequest(
    string Email,
    ApiWorkspaceRole Role);
