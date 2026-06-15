namespace InsightVault.API.Domain.Entities;

public sealed class CreditPackage
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public long PriceVnd { get; set; }
    public int Credits { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public List<PaymentOrder> PaymentOrders { get; set; } = [];
}
