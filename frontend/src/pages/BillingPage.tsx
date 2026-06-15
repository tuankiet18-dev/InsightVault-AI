import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  Database,
  Loader2,
  Package,
  PlusCircle,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react'

import {
  useBillingPlans,
  useCreateBillingCheckout,
  useCreditPackages,
  useWorkspaceBilling,
} from '@/hooks/useBilling'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import type { BillingPlanDto, CreditPackageDto } from '@/types/api'

const formatVnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value)

const formatBytes = (bytes: number) => {
  if (bytes <= 0) return '0 GB'
  const gb = bytes / 1024 / 1024 / 1024
  return `${Math.round(gb)} GB`
}

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

export function BillingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: workspaces = [], isLoading: isLoadingWorkspaces } = useWorkspaces()
  const selectedWorkspaceId = searchParams.get('workspaceId') || workspaces[0]?.id || null
  const selectedWorkspace = workspaces.find((workspace) => workspace.id === selectedWorkspaceId) || null
  const canCheckout = selectedWorkspace?.currentUserRole === 'owner'

  const { data: billing, isLoading: isLoadingBilling, isError: hasBillingError } =
    useWorkspaceBilling(selectedWorkspaceId)
  const { data: plans = [], isLoading: isLoadingPlans } = useBillingPlans()
  const { data: creditPackages = [], isLoading: isLoadingCredits } = useCreditPackages()
  const checkout = useCreateBillingCheckout(selectedWorkspaceId)
  const isLoading = isLoadingWorkspaces || isLoadingBilling || isLoadingPlans || isLoadingCredits

  const chooseWorkspace = (workspaceId: string) => {
    setSearchParams({ workspaceId })
  }

  const startCheckout = (productCode: string) => {
    if (!selectedWorkspaceId || !canCheckout) return
    checkout.mutate(productCode)
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-card)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)] text-white">
                <WalletCards className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">Billing and credits</h1>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Manage workspace plan, AI credits, storage, and checkout.
                </p>
              </div>
            </div>
          </div>

          {workspaces.length > 0 && (
            <label className="flex min-w-64 flex-col gap-1 text-sm font-medium text-[var(--color-muted-foreground)]">
              Workspace
              <select
                value={selectedWorkspaceId || ''}
                onChange={(event) => chooseWorkspace(event.target.value)}
                className="h-10 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] outline-none transition focus:border-[var(--color-ring)]"
              >
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-8">
        {isLoading ? (
          <div className="flex min-h-72 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-card)]">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
          </div>
        ) : workspaces.length === 0 ? (
          <section className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center">
            <Package className="mx-auto h-8 w-8 text-[var(--color-muted-foreground)]" />
            <h2 className="mt-4 text-lg font-semibold">Create a workspace before setting up billing</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[var(--color-muted-foreground)]">
              Billing is attached to a workspace so credits, members, and storage limits stay scoped to the team.
            </p>
            <Link
              to="/dashboard"
              className="mt-5 inline-flex h-10 items-center justify-center rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
            >
              Go to dashboard
            </Link>
          </section>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <section className="space-y-5">
              <CurrentPlanPanel
                billing={billing}
                hasBillingError={hasBillingError}
                canCheckout={canCheckout}
              />

              <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">Plans</h2>
                    <p className="text-sm text-[var(--color-muted-foreground)]">
                      Choose the monthly workspace capacity for documents and AI work.
                    </p>
                  </div>
                  {!canCheckout && (
                    <span className="rounded-full bg-[var(--color-secondary)] px-3 py-1 text-xs font-medium text-[var(--color-muted-foreground)]">
                      Owner only
                    </span>
                  )}
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {plans.map((plan) => (
                    <PlanCard
                      key={plan.code}
                      plan={plan}
                      isCurrent={billing?.plan.code === plan.code}
                      isCheckoutPending={checkout.isPending && checkout.variables === plan.code}
                      canCheckout={canCheckout}
                      onCheckout={startCheckout}
                    />
                  ))}
                </div>
              </section>
            </section>

            <aside className="space-y-5">
              <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                <h2 className="text-lg font-semibold">Credit top-ups</h2>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  Add one-time credits when a workspace needs extra extraction, chat, or report runs.
                </p>

                <div className="mt-5 space-y-3">
                  {creditPackages.map((creditPackage) => (
                    <CreditPackageRow
                      key={creditPackage.code}
                      creditPackage={creditPackage}
                      isCheckoutPending={checkout.isPending && checkout.variables === creditPackage.code}
                      canCheckout={canCheckout}
                      onCheckout={startCheckout}
                    />
                  ))}
                </div>
              </section>

              <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-5">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
                  Checkout rules
                </div>
                <ul className="mt-4 space-y-3 text-sm text-[var(--color-muted-foreground)]">
                  <li>Only workspace owners can change plans or buy top-up credits.</li>
                  <li>PayOS returns the user to success or cancel pages after checkout.</li>
                  <li>Credits are consumed by AI jobs and enforced by the backend.</li>
                </ul>
              </section>
            </aside>
          </div>
        )}
      </div>
    </main>
  )
}

function CurrentPlanPanel({
  billing,
  hasBillingError,
  canCheckout,
}: {
  billing?: import('@/types/api').BillingSummaryDto
  hasBillingError: boolean
  canCheckout: boolean
}) {
  if (hasBillingError) {
    return (
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-5">
        <h2 className="text-lg font-semibold">Billing status unavailable</h2>
        <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
          The workspace exists, but the billing summary could not be loaded. Try again after the API is ready.
        </p>
      </section>
    )
  }

  if (!billing) {
    return null
  }

  const creditRatio = billing.totalCreditsRemaining > 0
    ? Math.min(100, Math.round((billing.totalCreditsRemaining / billing.plan.includedCredits) * 100))
    : 0

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{billing.plan.name}</h2>
            <span className="rounded-full bg-[var(--status-completed)] px-2.5 py-1 text-xs font-medium capitalize text-[var(--status-completed-foreground)]">
              {billing.status}
            </span>
            {billing.cancelAtPeriodEnd && (
              <span className="rounded-full bg-[var(--status-processing)] px-2.5 py-1 text-xs font-medium text-[var(--status-processing-foreground)]">
                Cancels at period end
              </span>
            )}
          </div>
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
            {billing.plan.description}
          </p>
        </div>

        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-sm">
          <div className="font-semibold">{formatVnd(billing.plan.priceVnd)}</div>
          <div className="text-[var(--color-muted-foreground)]">
            per {billing.plan.billingPeriodMonths} month cycle
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Metric icon={CreditCard} label="Credits left" value={billing.totalCreditsRemaining.toLocaleString()} />
        <Metric icon={Users} label="Members" value={`${billing.plan.maxMembers} seats`} />
        <Metric icon={Database} label="Storage" value={formatBytes(billing.plan.storageLimitBytes)} />
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-xs font-medium text-[var(--color-muted-foreground)]">
          <span>Credit balance</span>
          <span>
            {billing.recurringCreditsRemaining.toLocaleString()} recurring +{' '}
            {billing.topUpCreditsRemaining.toLocaleString()} top-up
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-[var(--color-secondary)]">
          <div className="h-full bg-[var(--color-primary)]" style={{ width: `${creditRatio}%` }} />
        </div>
        <div className="mt-2 text-xs text-[var(--color-muted-foreground)]">
          Current cycle: {formatDate(billing.currentPeriodStart)} - {formatDate(billing.currentPeriodEnd)}
        </div>
      </div>

      {!canCheckout && (
        <p className="mt-5 text-sm text-[var(--color-muted-foreground)]">
          You can view this billing page, but only the workspace owner can start checkout.
        </p>
      )}
    </section>
  )
}

function PlanCard({
  plan,
  isCurrent,
  isCheckoutPending,
  canCheckout,
  onCheckout,
}: {
  plan: BillingPlanDto
  isCurrent: boolean
  isCheckoutPending: boolean
  canCheckout: boolean
  onCheckout: (productCode: string) => void
}) {
  return (
    <article className="flex min-h-64 flex-col rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{plan.name}</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">{plan.description}</p>
        </div>
        {isCurrent && <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--status-completed-foreground)]" />}
      </div>

      <div className="mt-5">
        <span className="text-2xl font-semibold">{formatVnd(plan.priceVnd)}</span>
        <span className="text-sm text-[var(--color-muted-foreground)]"> / cycle</span>
      </div>

      <div className="mt-5 grid gap-2 text-sm text-[var(--color-muted-foreground)]">
        <span>{plan.includedCredits.toLocaleString()} included credits</span>
        <span>{plan.maxMembers} workspace members</span>
        <span>{formatBytes(plan.storageLimitBytes)} document storage</span>
      </div>

      <button
        type="button"
        disabled={!canCheckout || isCheckoutPending || isCurrent}
        onClick={() => onCheckout(plan.code)}
        className="mt-auto inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:bg-[var(--color-secondary)] disabled:text-[var(--color-muted-foreground)]"
      >
        {isCheckoutPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {isCurrent ? 'Current plan' : 'Choose plan'}
      </button>
    </article>
  )
}

function CreditPackageRow({
  creditPackage,
  isCheckoutPending,
  canCheckout,
  onCheckout,
}: {
  creditPackage: CreditPackageDto
  isCheckoutPending: boolean
  canCheckout: boolean
  onCheckout: (productCode: string) => void
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold">{creditPackage.name}</div>
          <div className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {creditPackage.credits.toLocaleString()} credits
          </div>
        </div>
        <div className="text-right text-sm font-semibold">{formatVnd(creditPackage.priceVnd)}</div>
      </div>
      <button
        type="button"
        disabled={!canCheckout || isCheckoutPending}
        onClick={() => onCheckout(creditPackage.code)}
        className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-sm font-semibold transition hover:border-[var(--color-primary)] disabled:cursor-not-allowed disabled:text-[var(--color-muted-foreground)]"
      >
        {isCheckoutPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
        Buy credits
      </button>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CreditCard
  label: string
  value: string
}) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-4">
      <Icon className="h-4 w-4 text-[var(--color-primary)]" />
      <div className="mt-3 text-xl font-semibold">{value}</div>
      <div className="text-sm text-[var(--color-muted-foreground)]">{label}</div>
    </div>
  )
}
