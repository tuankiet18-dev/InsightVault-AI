using System.Text.Json;
using InsightVault.API.Domain.Entities;

namespace InsightVault.API.Application.Services.AiJobs;

internal static class AiJobOutputPayload
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public static Guid? GetReportId(AiJob job)
    {
        if (string.IsNullOrWhiteSpace(job.OutputPayload) || job.OutputPayload == "{}")
        {
            return null;
        }

        try
        {
            var payload = JsonSerializer.Deserialize<AiJobReportOutputPayload>(job.OutputPayload, JsonOptions);
            return payload?.ReportId;
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private sealed record AiJobReportOutputPayload(Guid? ReportId);
}
