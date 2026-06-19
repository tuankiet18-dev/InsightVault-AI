using System.Text.RegularExpressions;
using InsightVault.API.Common.Errors;

namespace InsightVault.API.Application.Services.SystemSettings;

public static partial class SystemSettingValidation
{
    public static string NormalizeAiModelName(string value)
    {
        var normalized = value.Trim();
        if (string.IsNullOrWhiteSpace(normalized))
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "admin.invalid_ai_model",
                "Default AI model is required.");
        }

        if (normalized.Length > 128 || !AiModelNameRegex().IsMatch(normalized))
        {
            throw new ApiException(
                StatusCodes.Status400BadRequest,
                "admin.invalid_ai_model",
                "Default AI model must be 1-128 characters and may only contain letters, numbers, '.', '_', '-', '/', or ':'.");
        }

        return normalized;
    }

    [GeneratedRegex("^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$")]
    private static partial Regex AiModelNameRegex();
}
