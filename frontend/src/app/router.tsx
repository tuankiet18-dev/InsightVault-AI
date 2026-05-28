import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { WorkspacePage } from '@/pages/WorkspacePage'
import { ChatPage } from '@/pages/ChatPage'
import { ComparePage } from '@/pages/ComparePage'
import { AdminPage } from '@/pages/AdminPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <WorkspacePage />,
  },
  {
    path: '/chat',
    element: <ChatPage />,
  },
  {
    path: '/compare',
    element: <ComparePage />,
  },
  {
    path: '/reports',
    element: <Navigate to="/" replace />, // Reports are just tabs in MVP
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
