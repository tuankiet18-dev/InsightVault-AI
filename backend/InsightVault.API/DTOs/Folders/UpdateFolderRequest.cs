using System.Text.Json;
using System.Text.Json.Serialization;

namespace InsightVault.API.DTOs.Folders;

public sealed record UpdateFolderRequest(
    string? Name = null,
    string? Description = null,
    JsonElement? ParentFolderId = null)
{
    [JsonIgnore]
    public bool HasParentFolderId => ParentFolderId.HasValue;

    public Guid? GetParentFolderId()
    {
        if (!ParentFolderId.HasValue || ParentFolderId.Value.ValueKind == JsonValueKind.Null)
        {
            return null;
        }

        if (ParentFolderId.Value.ValueKind == JsonValueKind.String
            && Guid.TryParse(ParentFolderId.Value.GetString(), out var folderId))
        {
            return folderId;
        }

        throw new ArgumentException("parentFolderId must be a valid UUID or null.");
    }
}
