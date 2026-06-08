import { createBrowserRouter, RouterProvider, Navigate, NavLink, Outlet } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminPage } from '@/pages/AdminPage'
import { WorkspacePage } from '@/pages/WorkspacePage'
import { UserDashboardPage } from '@/pages/UserDashboardPage'
import { ChatPage } from '@/pages/ChatPage'
import { ComparePage } from '@/pages/ComparePage'
const AdminLayout = () => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="flex h-14 items-center gap-6 border-b border-border bg-card px-6">
      <div className="font-semibold">InsightVault Admin</div>
      <nav className="flex items-center gap-1 text-sm text-muted-foreground">
        <NavLink className="rounded-md px-3 py-1.5 hover:bg-accent hover:text-foreground" to="/admin" end>
          Dashboard
        </NavLink>
        <NavLink className="rounded-md px-3 py-1.5 hover:bg-accent hover:text-foreground" to="/admin/users">
          Users
        </NavLink>
        <NavLink className="rounded-md px-3 py-1.5 hover:bg-accent hover:text-foreground" to="/admin/jobs">
          AI Jobs
        </NavLink>
      </nav>
    </header>
    <Outlet />
  </div>
)

const AdminUsersPage = () => (
  <main className="p-8">
    <h1 className="text-xl font-semibold">Users</h1>
    <p className="mt-2 text-sm text-muted-foreground">User management will be implemented in the admin portal task.</p>
  </main>
)

const AdminJobsPage = () => (
  <main className="p-8">
    <h1 className="text-xl font-semibold">AI Jobs</h1>
    <p className="mt-2 text-sm text-muted-foreground">System-wide AI job monitoring will be implemented in the admin portal task.</p>
  </main>
)

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/dashboard',
    element: <ProtectedRoute><UserDashboardPage /></ProtectedRoute>,
  },
  {
    path: '/workspace',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/workspaces/:workspaceId',
    element: <ProtectedRoute><WorkspacePage /></ProtectedRoute>,
  },
  {
  path: '/chat',
  element: (<ProtectedRoute> <ChatPage /> </ProtectedRoute>),
},
{
  path: '/compare',
  element: (<ProtectedRoute><ComparePage /></ProtectedRoute>),
},
  {
    path: '/admin',
    element: <ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>,
    children: [
      {
        index: true,
        element: <AdminPage />,
      },
      {
        path: 'users',
        element: <AdminUsersPage />,
      },
      {
        path: 'jobs',
        element: <AdminJobsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
