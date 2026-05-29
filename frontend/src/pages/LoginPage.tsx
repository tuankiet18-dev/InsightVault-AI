import { GoogleLogin } from '@react-oauth/google'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export function LoginPage() {
  const { loginWithGoogle, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()

  // Where to redirect after login (or if already authenticated)
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/'

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
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-surface-0 rounded-3xl shadow-xl border border-border p-8 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-primary-100">
          <div className="text-2xl font-black text-primary-600 tracking-tighter">
            IV
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-surface-900 mb-2 tracking-tight">
          Welcome to InsightVault
        </h1>
        <p className="text-surface-500 mb-8 text-sm">
          Sign in to access your secure AI knowledge workspace and project documents.
        </p>

        <div className="flex flex-col items-center justify-center gap-4">
          <GoogleLogin
            onSuccess={handleSuccess}
            onError={() => {
              console.log('Login Failed')
            }}
            theme="outline"
            size="large"
            shape="rectangular"
            width="100%"
          />
        </div>

        <div className="mt-10 pt-6 border-t border-border/50 text-xs text-surface-400 flex flex-col items-center gap-2">
          <div className="flex items-center gap-1.5 justify-center">
            <ShieldCheck className="w-4 h-4 text-success-500" />
            <span>Enterprise-grade security & encryption</span>
          </div>
          <p>InsightVault API Connection Active</p>
        </div>
      </div>
    </div>
  )
}
