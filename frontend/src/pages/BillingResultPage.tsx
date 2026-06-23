import { Link, useLocation } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react'

export function BillingResultPage({ status }: { status: 'success' | 'cancel' }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  const workspaceId = params.get('workspaceId')
  const isSuccess = status === 'success'

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-5 text-[var(--color-foreground)]">
      <section className="w-full max-w-md rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-6 text-center">
        <div
          className={[
            'mx-auto flex h-12 w-12 items-center justify-center rounded-full',
            isSuccess
              ? 'bg-[var(--status-completed)] text-[var(--status-completed-foreground)]'
              : 'bg-[var(--status-failed)] text-[var(--status-failed-foreground)]',
          ].join(' ')}
        >
          {isSuccess ? <CheckCircle2 className="h-6 w-6" /> : <XCircle className="h-6 w-6" />}
        </div>
        <h1 className="mt-5 text-2xl font-semibold">
          {isSuccess ? 'Checkout completed' : 'Checkout canceled'}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
          {isSuccess
            ? 'Your payment is being reconciled by the backend. Credits and plan changes will appear after the webhook is applied.'
            : 'No billing changes were applied. You can return to billing and start a new checkout when ready.'}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to={workspaceId ? `/workspaces/${workspaceId}/billing` : '/billing'}
            className="inline-flex h-10 items-center justify-center rounded-md bg-[var(--color-primary)] px-4 text-sm font-semibold text-white"
          >
            Back to billing
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[var(--color-border)] px-4 text-sm font-semibold"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  )
}
