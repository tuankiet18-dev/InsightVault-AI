using InsightVault.API.DTOs.Common;

namespace InsightVault.API.DTOs.Admin;

public sealed record UpdateUserAdminRequest(
    bool? IsActive = null,
    ApiSystemRole? SystemRole = null);
