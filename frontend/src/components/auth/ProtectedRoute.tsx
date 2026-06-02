import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Loader2 } from 'lucide-react'

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: {
  children: React.ReactNode
  requireAdmin?: boolean
}) {
  const { isAuthenticated, isLoading, user } = useAuthStore()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-surface-50 text-surface-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login page and save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireAdmin && user?.systemRole !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
