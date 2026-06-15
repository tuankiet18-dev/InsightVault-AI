namespace InsightVault.API.Application.Services.Billing;

public static class BillingCreditCosts
{
    private const long FiveMegabytes = 5L * 1024 * 1024;

    public static int ForDocument(long fileSizeBytes, BillingOptions options)
    {
        var units = Math.Max(1, (int)Math.Ceiling(fileSizeBytes / (double)FiveMegabytes));
        return units * options.DocumentCreditsPerFiveMb;
    }

    public static int ForReport(BillingOptions options)
    {
        return options.GenerateReportBaseCredits;
    }

    public static int ForCompare(int documentCount, BillingOptions options)
    {
        var additionalDocuments = Math.Max(0, documentCount - 2);
        return options.CompareBaseCredits
            + additionalDocuments * options.CompareAdditionalDocumentCredits;
    }
}
