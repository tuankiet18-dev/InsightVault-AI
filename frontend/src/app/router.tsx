import { createBrowserRouter, RouterProvider, Navigate, NavLink, Outlet } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AdminPage } from '@/pages/AdminPage'
import { WorkspacePage } from '@/pages/WorkspacePage'
import { UserDashboardPage } from '@/pages/UserDashboardPage'
import { ChatPage } from '@/pages/ChatPage'
import { ComparePage } from '@/pages/ComparePage'
import { InvitationsPage } from '@/pages/InvitationsPage'
import { InvitationDetailPage } from '@/pages/InvitationDetailPage'
import { BillingPage } from '@/pages/BillingPage'

import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { AdminJobsPage } from '@/pages/admin/AdminJobsPage'
import { AdminWorkspacesPage } from '@/pages/admin/AdminWorkspacesPage'
import { AdminBillingPage } from '@/pages/admin/AdminBillingPage'
import { AdminSettingsPage } from '@/pages/admin/AdminSettingsPage'
import { BillingReturnPage } from '@/pages/BillingReturnPage'
import { PublicReportPage } from '@/pages/PublicReportPage'

const adminNavClass = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? 'rounded-md bg-primary px-3 py-1.5 text-primary-foreground'
    : 'rounded-md px-3 py-1.5 text-muted-foreground hover:bg-accent hover:text-foreground'

const AdminLayout = () => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 backdrop-blur lg:px-6">
      <div className="flex min-h-14 flex-wrap items-center gap-3 py-2">
        <div className="mr-2 font-semibold">InsightVault Admin</div>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          <NavLink className={adminNavClass} to="/admin" end>
            Dashboard
          </NavLink>
          <NavLink className={adminNavClass} to="/admin/users">
            Users
          </NavLink>
          <NavLink className={adminNavClass} to="/admin/jobs">
            AI Jobs
          </NavLink>
          <NavLink className={adminNavClass} to="/admin/workspaces">
            Workspaces
          </NavLink>
          <NavLink className={adminNavClass} to="/admin/billing">
            Billing
          </NavLink>
          <NavLink className={adminNavClass} to="/admin/settings">
            Settings
          </NavLink>
        </nav>
      </div>
    </header>
    <Outlet />
  </div>
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
    path: '/invitations',
    element: <ProtectedRoute><InvitationsPage /></ProtectedRoute>,
  },
  {
    path: '/invitations/:invitationId',
    element: <ProtectedRoute><InvitationDetailPage /></ProtectedRoute>,
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
    path: '/billing',
    element: <ProtectedRoute><BillingPage /></ProtectedRoute>,
  },
  {
    path: '/workspaces/:workspaceId/billing',
    element: <ProtectedRoute><BillingPage /></ProtectedRoute>,
  },
  {
    path: '/billing/return',
    element: <BillingReturnPage />,
  },
  {
    path: '/shared/reports/:token',
    element: <PublicReportPage />,
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
      {
        path: 'workspaces',
        element: <AdminWorkspacesPage />,
      },
      {
        path: 'billing',
        element: <AdminBillingPage />,
      },
      {
        path: 'settings',
        element: <AdminSettingsPage />,
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
