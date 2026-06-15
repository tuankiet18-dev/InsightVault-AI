namespace InsightVault.API.Application.Services.Billing;

public sealed class BillingOptions
{
    public bool EnforceCredits { get; set; } = true;
    public int DocumentCreditsPerFiveMb { get; set; } = 1;
    public int GenerateReportBaseCredits { get; set; } = 5;
    public int CompareBaseCredits { get; set; } = 5;
    public int CompareAdditionalDocumentCredits { get; set; } = 2;
}
