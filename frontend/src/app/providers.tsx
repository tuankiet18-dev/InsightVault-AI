import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { Toaster } from '@/components/ui/sonner'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  const { fetchCurrentUser } = useAuthStore()

  // Ensure theme initializes
  useThemeStore(state => state.theme)

  useEffect(() => {
    fetchCurrentUser()
  }, [fetchCurrentUser])

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </GoogleOAuthProvider>
  )
}
