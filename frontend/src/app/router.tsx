import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { WorkspacePage } from '@/pages/WorkspacePage'
import { LandingPage } from '@/pages/LandingPage'
import { ChatPage } from '@/pages/ChatPage'
import { ComparePage } from '@/pages/ComparePage'
import { AdminPage } from '@/pages/AdminPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/workspace',
    element: <ProtectedRoute><WorkspacePage /></ProtectedRoute>,
  },
  {
    path: '/chat',
    element: <ProtectedRoute><ChatPage /></ProtectedRoute>,
  },
  {
    path: '/compare',
    element: <ProtectedRoute><ComparePage /></ProtectedRoute>,
  },
  {
    path: '/reports',
    element: <Navigate to="/" replace />, // Reports are just tabs in MVP
  },
  {
    path: '/admin',
    element: <ProtectedRoute><AdminPage /></ProtectedRoute>,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
