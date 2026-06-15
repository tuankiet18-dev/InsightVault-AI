import { GoogleLogin } from '@react-oauth/google'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Bot, CheckCircle2, FolderLock, ShieldCheck } from 'lucide-react'

import { useAuthStore } from '@/stores/authStore'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const assurances = [
  {
    icon: FolderLock,
    label: 'Workspace access follows backend roles',
  },
  {
    icon: Bot,
    label: 'AI answers keep document sources visible',
  },
  {
    icon: ShieldCheck,
    label: 'Protected routes require a valid session',
  },
]

export function LoginPage() {
  const { loginWithGoogle, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSuccess = async (credentialResponse: import('@react-oauth/google').CredentialResponse) => {
    if (!credentialResponse.credential) return

    try {
      await loginWithGoogle(credentialResponse.credential)
      navigate(from, { replace: true })
    } catch (error) {
      console.error('Login error:', error)
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)] px-5 py-6 text-[var(--color-foreground)]">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-5xl items-center justify-center">
        <section className="grid w-full overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm lg:grid-cols-[1fr_420px]">
          <div className="hidden border-r border-[var(--color-border)] bg-[var(--color-background)] p-8 lg:block">
            <div className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 font-mono text-xs text-[var(--color-muted-foreground)]">
              <span className="flex h-6 w-6 items-center justify-center rounded bg-[var(--color-primary)] text-[10px] font-bold text-white">
                IV
              </span>
              INSIGHTVAULT AI
            </div>

            <h1 className="mt-10 max-w-md text-3xl font-semibold leading-tight tracking-tight">
              Return to your team's document intelligence workspace.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-[var(--color-muted-foreground)]">
              Continue with workspace documents, cited chat, comparisons, reports, and billing controls
              from one protected product surface.
            </p>

            <div className="mt-8 space-y-3">
              {assurances.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-sm">
                    <Icon className="h-4 w-4 text-[var(--color-primary)]" />
                    <span>{item.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-8">
            <div className="mx-auto w-full max-w-sm">
              <div className="flex items-center gap-3 lg:hidden">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[var(--color-primary)] font-mono font-bold text-white">
                  IV
                </div>
                <div>
                  <div className="font-semibold">InsightVault AI</div>
                  <div className="text-xs text-[var(--color-muted-foreground)]">Document intelligence workspace</div>
                </div>
              </div>

              <div className="mt-8 lg:mt-0">
                <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--color-muted-foreground)]">
                  Use Google to access your workspaces and continue from the last protected route.
                </p>
              </div>

              {googleClientId ? (
                <div className="mt-7 flex justify-center">
                  <GoogleLogin
                    onSuccess={handleSuccess}
                    onError={() => {
                      console.error('Login Failed')
                    }}
                    theme="outline"
                    size="large"
                    shape="rectangular"
                    width="320"
                  />
                </div>
              ) : (
                <div className="mt-7 rounded-md border border-[var(--status-processing)] bg-[var(--status-processing)]/40 p-4 text-sm text-[var(--status-processing-foreground)]">
                  Google sign-in is not configured. Set VITE_GOOGLE_CLIENT_ID for the frontend.
                </div>
              )}

              <div className="mt-7 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                <div className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--status-completed-foreground)]" />
                  <p className="leading-6 text-[var(--color-muted-foreground)]">
                    After sign-in, the API validates your account and workspace memberships before loading
                    dashboard data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
