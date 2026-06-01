import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { workspaceApi } from '@/api/workspaceApi'
import { adminApi } from '@/api/adminApi'
import type { WorkspaceDto, UserDashboardDto } from '@/types/api'
import { Folder, FileText, Settings, LogOut, Plus, ChevronRight, Activity } from 'lucide-react'

export function UserDashboardPage() {
  const { user, logout } = useAuthStore()
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([])
  const [stats, setStats] = useState<UserDashboardDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wsData, statsData] = await Promise.all([
          workspaceApi.getWorkspaces(),
          adminApi.getDashboard()
        ])
        setWorkspaces(wsData)
        setStats(statsData)
      } catch (error) {
        console.error('Failed to fetch dashboard data', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-ai)] font-bold text-white shadow-sm">
            IV
          </div>
          <span className="font-semibold">InsightVault</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary)]">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <span>{user?.fullName}</span>
          </div>
          {user?.systemRole === 'admin' && (
            <Link to="/admin" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10">
              <Settings className="h-4 w-4" />
              Admin Portal
            </Link>
          )}
          <button onClick={logout} className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-12 animate-in fade-in zoom-in-95 duration-500">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Welcome back, {user?.fullName?.split(' ')[0] || 'User'}</h1>
        <p className="mb-8 text-[var(--color-muted-foreground)]">Select a workspace to continue working or create a new one.</p>

        {/* Quick Stats */}
        <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)]">
              <Folder className="h-4 w-4" />
              Total Workspaces
            </div>
            <div className="text-3xl font-bold">{isLoading ? '-' : stats?.workspaceCount || 0}</div>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)]">
              <FileText className="h-4 w-4" />
              Documents Uploaded
            </div>
            <div className="text-3xl font-bold">{isLoading ? '-' : stats?.documentCount || 0}</div>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)]">
              <Activity className="h-4 w-4" />
              Reports Generated
            </div>
            <div className="text-3xl font-bold">{isLoading ? '-' : stats?.reportCount || 0}</div>
          </div>
        </section>

        {/* Workspaces List */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Your Workspaces</h2>
            <button className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary)]/90">
              <Plus className="h-4 w-4" />
              New Workspace
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {isLoading ? (
              <div className="col-span-full py-12 text-center text-[var(--color-muted-foreground)]">Loading workspaces...</div>
            ) : workspaces.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-[var(--color-border)] py-12 text-center text-[var(--color-muted-foreground)]">
                You don't have any workspaces yet. Create one to get started.
              </div>
            ) : (
              workspaces.map(ws => (
                <Link
                  key={ws.id}
                  to={`/workspaces/${ws.id}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm transition-all hover:border-[var(--color-primary)] hover:shadow-md"
                >
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="text-lg font-semibold">{ws.name}</h3>
                      <span className="rounded-full bg-[var(--color-secondary)] px-2.5 py-0.5 text-xs font-medium capitalize text-[var(--color-foreground)]">
                        {ws.currentUserRole}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-sm text-[var(--color-muted-foreground)]">
                      {ws.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center text-sm font-medium text-[var(--color-primary)] opacity-0 transition-opacity group-hover:opacity-100">
                    Open workspace <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
