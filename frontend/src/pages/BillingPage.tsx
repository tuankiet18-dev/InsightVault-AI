import { Link, Navigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Check,
  Coins,
  CreditCard,
  Database,
  Loader2,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useWorkspace } from '@/hooks/useWorkspaces'
import {
  useBillingCatalog,
  useCreateBillingCheckout,
  useWorkspaceBilling,
} from '@/hooks/useBilling'
import { pendingBillingWorkspaceKey } from '@/lib/billing'

export function BillingPage() {
  const { workspaceId } = useParams()
  const { data: workspace, isLoading: workspaceLoading } = useWorkspace(
    workspaceId ?? null,
  )
  const billing = useWorkspaceBilling(workspaceId)
  const { plans, creditPackages } = useBillingCatalog()
  const checkout = useCreateBillingCheckout(workspaceId ?? '')
  const currentPlanCode = billing.data?.plan.code
  const isOwner = workspace?.currentUserRole === 'owner'
  const isLoading =
    workspaceLoading ||
    billing.isLoading ||
    plans.isLoading ||
    creditPackages.isLoading

  const activeProduct = checkout.variables

  const startCheckout = async (productCode: string) => {
    if (!workspaceId || !isOwner) return

    try {
      const session = await checkout.mutateAsync(productCode)
      const checkoutUrl = new URL(session.checkoutUrl)
      if (checkoutUrl.protocol !== 'https:') {
        toast.error('Backend returned an unexpected payment URL.')
        return
      }

      sessionStorage.setItem(pendingBillingWorkspaceKey, workspaceId)
      window.location.assign(checkoutUrl.toString())
    } catch {
      // The mutation surfaces the API error through its onError handler.
    }
  }

  const formattedPeriodEnd = billing.data?.currentPeriodEnd
    ? new Date(billing.data.currentPeriodEnd).toLocaleDateString('vi-VN')
    : null

  if (!workspaceId) return <Navigate to="/dashboard" replace />

  return (
    <div className="min-h-screen bg-surface-50 text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to={`/workspaces/${workspaceId}`} aria-label="Back to workspace">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="text-sm font-semibold">Workspace billing</div>
              <div className="text-xs text-muted-foreground">
                {workspace?.name ?? 'InsightVault'}
              </div>
            </div>
          </div>
          <div className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
            {workspace?.currentUserRole ?? 'member'}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-5 py-8">
        <section>
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary">AI usage plans</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Choose the capacity your workspace needs
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Credits are shared by all workspace members. Recurring credits are
              used first, while top-up credits remain available across billing
              periods.
            </p>
          </div>
        </section>

        {!isOwner && (
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertTitle>Owner permission required</AlertTitle>
            <AlertDescription>
              You can view usage, but only the workspace owner can purchase a
              plan or top up credits.
            </AlertDescription>
          </Alert>
        )}

        {isLoading ? (
          <div className="space-y-8">
            <section className="grid gap-4 md:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                  </div>
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-3 w-32" />
                </div>
              ))}
            </section>
            <section>
              <div className="mb-4 space-y-2">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-4 w-64" />
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-xl border border-border bg-card p-6 shadow-sm">
                    <Skeleton className="h-6 w-24 mb-4" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-4/5 mb-6" />
                    <Skeleton className="h-10 w-32 mb-6" />
                    <div className="space-y-3 mb-7">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-4/5" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : billing.isError || plans.isError || creditPackages.isError ? (
          <Alert variant="destructive">
            <AlertTitle>Billing could not be loaded</AlertTitle>
            <AlertDescription>
              Check the backend connection and try refreshing this page.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            {billing.data && (
              <section className="grid gap-4 md:grid-cols-4">
                <SummaryCard
                  label="Current plan"
                  value={billing.data.plan.name}
                  detail={`Renews through ${formattedPeriodEnd ?? '-'}`}
                  icon={Zap}
                />
                <SummaryCard
                  label="Credits remaining"
                  value={formatNumber(billing.data.totalCreditsRemaining)}
                  detail={`${formatNumber(billing.data.recurringCreditsRemaining)} recurring`}
                  icon={Coins}
                />
                <SummaryCard
                  label="Top-up balance"
                  value={formatNumber(billing.data.topUpCreditsRemaining)}
                  detail="Does not reset monthly"
                  icon={CreditCard}
                />
                <SummaryCard
                  label="Storage limit"
                  value={formatStorage(billing.data.plan.storageLimitBytes)}
                  detail={`${billing.data.plan.maxMembers} member seats`}
                  icon={Database}
                />
              </section>
            )}

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Monthly plans</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upgrade applies after VNPay confirms the sandbox transaction.
                </p>
              </div>
              <div className="grid gap-4 lg:grid-cols-3">
                {plans.data?.map((plan) => {
                  const isCurrent = plan.code === currentPlanCode
                  const isPurchasable = plan.priceVnd > 0
                  const isPending = checkout.isPending && activeProduct === plan.code

                  return (
                    <article
                      key={plan.code}
                      className={`relative rounded-xl border bg-card p-6 shadow-sm ${
                        plan.code === 'pro'
                          ? 'border-primary ring-1 ring-primary/20'
                          : 'border-border'
                      }`}
                    >
                      {plan.code === 'pro' && (
                        <span className="absolute right-4 top-4 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                          Recommended
                        </span>
                      )}
                      <h3 className="text-lg font-semibold">{plan.name}</h3>
                      <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
                        {plan.description}
                      </p>
                      <div className="mt-5">
                        <span className="text-3xl font-bold">
                          {formatVnd(plan.priceVnd)}
                        </span>
                        <span className="text-sm text-muted-foreground"> / month</span>
                      </div>
                      <ul className="mt-6 space-y-3 text-sm">
                        <Feature text={`${formatNumber(plan.includedCredits)} AI credits`} />
                        <Feature text={`Up to ${plan.maxMembers} members`} />
                        <Feature text={`${formatStorage(plan.storageLimitBytes)} storage`} />
                      </ul>
                      <Button
                        className="mt-7 w-full"
                        variant={plan.code === 'pro' ? 'default' : 'outline'}
                        disabled={!isOwner || !isPurchasable || isCurrent || checkout.isPending}
                        onClick={() => startCheckout(plan.code)}
                      >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isCurrent
                          ? 'Current plan'
                          : isPurchasable
                            ? `Choose ${plan.name}`
                            : 'Included by default'}
                      </Button>
                    </article>
                  )
                })}
              </div>
            </section>

            <section>
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Credit top-ups</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add credits without changing your current subscription.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {creditPackages.data?.map((creditPackage) => {
                  const isPending =
                    checkout.isPending && activeProduct === creditPackage.code
                  return (
                    <article
                      key={creditPackage.code}
                      className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">
                            One-time top-up
                          </p>
                          <h3 className="mt-1 text-xl font-semibold">
                            {formatNumber(creditPackage.credits)} credits
                          </h3>
                        </div>
                        <Coins className="h-6 w-6 text-primary" />
                      </div>
                      <div className="mt-5 text-2xl font-bold">
                        {formatVnd(creditPackage.priceVnd)}
                      </div>
                      <Button
                        variant="secondary"
                        className="mt-5 w-full hover:bg-secondary/80"
                        disabled={!isOwner || checkout.isPending}
                        onClick={() => startCheckout(creditPackage.code)}
                      >
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Buy credits
                      </Button>
                    </article>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string
  value: string
  detail: string
  icon: typeof Coins
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
  )
}

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2">
      <Check className="h-4 w-4 text-green-500" />
      <span>{text}</span>
    </li>
  )
}

function formatVnd(value: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatStorage(bytes: number) {
  const gigabytes = bytes / (1024 ** 3)
  return gigabytes >= 1
    ? `${Number.isInteger(gigabytes) ? gigabytes : gigabytes.toFixed(1)} GB`
    : `${Math.round(bytes / (1024 ** 2))} MB`
}
