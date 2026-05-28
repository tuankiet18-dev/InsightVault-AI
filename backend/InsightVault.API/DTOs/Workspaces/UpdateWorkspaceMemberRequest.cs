using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Workspaces;

public sealed record UpdateWorkspaceMemberRequest(
    ApiWorkspaceRole? Role = null,
    ApiMemberStatus? Status = null);
