import { GoogleLogin } from '@react-oauth/google'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { ShieldCheck, Sparkles } from 'lucide-react'

export function LoginPage() {
  const { loginWithGoogle, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Where to redirect after login (or if already authenticated)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard'

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  const handleSuccess = async (credentialResponse: import('@react-oauth/google').CredentialResponse) => {
    if (credentialResponse.credential) {
      try {
        await loginWithGoogle(credentialResponse.credential)
        navigate(from, { replace: true })
      } catch (error) {
        console.error('Login error:', error)
      }
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-background)] p-4 text-[var(--color-foreground)]">
      {/* Background gradients */}
      <div className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2">
        <div className="h-[400px] w-[600px] rounded-full bg-[var(--color-primary)]/20 blur-[100px] sm:h-[500px] sm:w-[800px]" />
      </div>

      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-card)]/70 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center text-center">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[var(--color-primary)] to-blue-400 shadow-lg">
              <span className="font-mono text-2xl font-bold tracking-tighter text-white">IV</span>
            </div>
            <h1 className="mb-2 text-3xl font-bold tracking-tight">InsightVault</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Log in to your secure AI knowledge workspace. Ask, compare, and report in seconds.
            </p>
          </div>

          <div className="mb-6 flex flex-col items-center justify-center gap-4">
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => {
                console.error('Login Failed')
              }}
              theme="outline"
              size="large"
              shape="rectangular"
              width="100%"
            />
          </div>

          <div className="mt-8 flex flex-col items-center gap-3 border-t border-[var(--color-border)] pt-6 text-xs text-[var(--color-muted-foreground)]">
            <div className="flex items-center gap-1.5 font-medium text-[var(--status-completed-foreground)]">
              <ShieldCheck className="h-4 w-4" />
              <span>Enterprise-grade security & encryption</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium">
              <Sparkles className="h-4 w-4 text-[var(--color-ai)]" />
              <span>Powered by advanced RAG & LLMs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
