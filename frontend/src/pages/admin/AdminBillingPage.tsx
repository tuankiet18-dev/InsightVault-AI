import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/adminApi'
import { Button } from '@/components/ui/button'

export function AdminBillingPage() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'billing'],
    queryFn: () => adminApi.getBilling(),
  })
  const togglePlan = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.updatePlan(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'billing'] }),
  })
  const togglePackage = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => adminApi.updateCreditPackage(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'billing'] }),
  })

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Billing & Plans</h1>
        <span className="text-sm text-muted-foreground">Revenue, orders, plans, credit packages</span>
      </div>

      {isLoading || !data ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">Loading billing...</div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <Metric label="Paid revenue" value={formatVnd(data.paidRevenueVnd)} />
            <Metric label="Orders" value={data.paymentOrderCount} />
            <Metric label="Paid orders" value={data.paidOrderCount} />
            <Metric label="Active subscriptions" value={data.activeSubscriptionCount} />
          </section>

          <section className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 font-semibold">Subscription plans</h2>
              <div className="space-y-3">
                {data.plans.map(plan => (
                  <div key={plan.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{plan.name}</div>
                        <div className="text-xs text-muted-foreground">{plan.includedCredits} credits / {plan.maxMembers} members / {formatBytes(plan.storageLimitBytes)}</div>
                      </div>
                      <Button
                        variant={plan.isActive ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => togglePlan.mutate({ id: plan.id, isActive: !plan.isActive })}
                      >
                        {plan.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                    <div className="mt-2 text-sm font-semibold">{formatVnd(plan.priceVnd)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 font-semibold">Credit packages</h2>
              <div className="space-y-3">
                {data.creditPackages.map(pack => (
                  <div key={pack.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-medium">{pack.name}</div>
                        <div className="text-xs text-muted-foreground">{pack.credits} credits</div>
                      </div>
                      <Button
                        variant={pack.isActive ? 'outline' : 'default'}
                        size="sm"
                        onClick={() => togglePackage.mutate({ id: pack.id, isActive: !pack.isActive })}
                      >
                        {pack.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                    <div className="mt-2 text-sm font-semibold">{formatVnd(pack.priceVnd)}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="border-b border-border px-4 py-3 font-semibold">Recent payment orders</div>
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3">Workspace</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className="px-4 py-3">{order.workspaceName}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{order.createdByEmail}</td>
                    <td className="px-4 py-3">{order.purchaseType}</td>
                    <td className="px-4 py-3">{order.status}</td>
                    <td className="px-4 py-3 font-medium">{formatVnd(order.amountVnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}
    </main>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  )
}

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
}

function formatBytes(bytes: number) {
  if (bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`
}
