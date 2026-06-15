import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'
import { billingApi, type PaymentReturnResponseDto } from '@/api/billingApi'
import { Button } from '@/components/ui/button'
import { pendingBillingWorkspaceKey } from '@/lib/billing'

export function BillingReturnPage() {
  const [result, setResult] = useState<PaymentReturnResponseDto | null>(null)
  const query = window.location.search.slice(1)
  const [error, setError] = useState<string | null>(
    query ? null : 'VNPay did not return payment information.',
  )
  const confirmed = useRef(false)
  const workspaceId = sessionStorage.getItem(pendingBillingWorkspaceKey)

  useEffect(() => {
    if (confirmed.current) return
    confirmed.current = true

    if (!query) return

    billingApi
      .confirmVnPayReturn(query)
      .then((response) => {
        setResult(response)
        if (response.successful) {
          sessionStorage.removeItem(pendingBillingWorkspaceKey)
        }
      })
      .catch((requestError: Error) => {
        setError(requestError.message || 'Unable to verify the payment.')
      })
  }, [query])

  const billingPath = workspaceId
    ? `/workspaces/${workspaceId}/billing`
    : '/dashboard'

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-50 px-5">
      <main className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {!result && !error ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold">Confirming payment</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              InsightVault is verifying the VNPay signature and transaction
              details. Please keep this page open.
            </p>
          </>
        ) : result?.successful ? (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-100">
              <CheckCircle2 className="h-8 w-8 text-success-600" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold">Payment confirmed</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {result.message}
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to={billingPath}>View workspace billing</Link>
            </Button>
          </>
        ) : (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-danger-100">
              <XCircle className="h-8 w-8 text-danger-600" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold">Payment not confirmed</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {error ?? result?.message ?? 'The transaction could not be verified.'}
            </p>
            <Button asChild variant="outline" className="mt-6 w-full">
              <Link to={billingPath}>Return to billing</Link>
            </Button>
          </>
        )}
      </main>
    </div>
  )
}
