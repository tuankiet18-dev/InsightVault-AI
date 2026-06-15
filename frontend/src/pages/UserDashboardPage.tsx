import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { UserDashboardDto } from '@/types/api'
import { Folder, FileText, Settings, LogOut, Plus, ChevronRight, Activity, CheckCircle, AlertTriangle, Clock, CreditCard, Mail } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useMyWorkspaceInvitations } from '@/hooks/useWorkspaceInvitations'
import { documentApi } from '@/api/documentApi'
import { reportApi } from '@/api/reportApi'

export function UserDashboardPage() {
  const { user, logout } = useAuthStore()
  const { data: workspaces = [], isLoading: isWorkspacesLoading } = useWorkspaces()
  const { data: invitations = [] } = useMyWorkspaceInvitations()
  const [stats, setStats] = useState<UserDashboardDto | null>(null)
  const [isStatsLoading, setIsStatsLoading] = useState(true)
  const { setCreateWorkspaceModalOpen } = useUiStore()

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      if (isWorkspacesLoading) return;

      if (!workspaces || workspaces.length === 0) {
        if (isMounted) {
          setStats({
            workspaceCount: 0,
            folderCount: 0,
            documentCount: 0,
            completedDocumentCount: 0,
            processingDocumentCount: 0,
            failedDocumentCount: 0,
            reportCount: 0,
            recentJobs: []
          })
          setIsStatsLoading(false)
        }
        return;
      }

      try {
        let totalDocs = 0;
        let totalReports = 0;

        let completedDocs = 0;
        let processingDocs = 0;
        let failedDocs = 0;

        await Promise.all(
          workspaces.map(async (ws) => {
            try {
              const [docs, reports] = await Promise.all([
                documentApi.getDocuments(ws.id),
                reportApi.getReports(ws.id)
              ]);
              totalDocs += docs.length;
              docs.forEach(doc => {
                if (doc.status === 'completed')
                  completedDocs++;

                if (doc.status === 'processing')
                  processingDocs++;

                if (doc.status === 'failed')
                  failedDocs++;
              });
              totalReports += reports.length;
            } catch (err) {
              console.error(`Failed to fetch stats for workspace ${ws.id}`, err);
            }
          })
        );

        if (isMounted) {
          setStats({
            workspaceCount: workspaces.length,
            folderCount: 0,
            documentCount: totalDocs,
            completedDocumentCount: completedDocs,
            processingDocumentCount: processingDocs,
            failedDocumentCount: failedDocs,
            reportCount: totalReports,
            recentJobs: []
          });
        }
      } catch (error) {
        console.error('Failed to aggregate dashboard data', error);
      } finally {
        if (isMounted) setIsStatsLoading(false);
      }
    }
    fetchStats()
    return () => { isMounted = false; }
  }, [workspaces, isWorkspacesLoading])

  const isLoading = isWorkspacesLoading || isStatsLoading

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-6 py-3 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3">
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
          <Link to="/invitations" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10">
            <Mail className="h-4 w-4" />
            Invitations
            {invitations.length > 0 && (
              <span className="rounded-full bg-[var(--color-primary)] px-2 py-0.5 text-xs font-semibold text-white">
                {invitations.length}
              </span>
            )}
          </Link>
          <Link to="/billing" className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10">
            <CreditCard className="h-4 w-4" />
            Billing
          </Link>
          <button onClick={logout} className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-12 animate-in fade-in zoom-in-95 duration-500">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Welcome back, {user?.fullName?.split(' ')[0] || 'User'}</h1>
        <p className="mb-8 text-[var(--color-muted-foreground)]">
          Select a workspace, check AI credit capacity, or create a new team space.
        </p>

        {/* Quick Stats */}
        <section className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
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

          <div className="rounded-xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-green-700">
              <CheckCircle className="h-4 w-4" />
              Completed Docs
            </div>

            <div className="text-3xl font-bold text-green-700">
              {isLoading ? '-' : stats?.completedDocumentCount || 0}
            </div>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-yellow-700">
              <Clock className="h-4 w-4" />
              Processing Docs
            </div>

            <div className="text-3xl font-bold text-yellow-700">
              {isLoading ? '-' : stats?.processingDocumentCount || 0}
            </div>
          </div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-red-700">
              <AlertTriangle className="h-4 w-4" />
              Failed Docs
            </div>

            <div className="text-3xl font-bold text-red-700">
              {isLoading ? '-' : stats?.failedDocumentCount || 0}
            </div>
          </div>
        </section>
        {/* Workspaces List */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">Your Workspaces</h2>
            <button
              onClick={() => setCreateWorkspaceModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary)]/90"
            >
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
      <CreateWorkspaceModal />
    </div>
  )
}
