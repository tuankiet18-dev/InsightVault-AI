import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { Folder, FileText, Settings, LogOut, Plus, ChevronRight, Activity, CheckCircle, AlertTriangle, Clock, WalletCards, CreditCard, Mail } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { CreateWorkspaceModal } from '@/components/workspace/CreateWorkspaceModal'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useMyWorkspaceInvitations } from '@/hooks/useWorkspaceInvitations'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { SettingsModal } from '@/components/settings/SettingsModal'

export function UserDashboardPage() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const { data: workspaces = [], isLoading: isWorkspacesLoading } = useWorkspaces()
  const { data: invitations = [] } = useMyWorkspaceInvitations()
  const { data: stats, isLoading: isStatsLoading } = useDashboardStats()
  const { setCreateWorkspaceModalOpen } = useUiStore()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)

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
        <div className="flex min-w-0 items-center gap-2">
          <DropdownMenu
            trigger={
              <button className="ml-1 flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-muted text-xs font-semibold text-foreground transition-colors hover:bg-accent">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.fullName || 'User'} className="h-full w-full object-cover" />
                ) : (
                  <span>{user?.fullName?.charAt(0) || 'U'}</span>
                )}
              </button>
            }
          >
            <div className="border-b border-border px-4 py-2">
              <p className="text-sm font-medium text-foreground">{user?.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} icon={<Settings className="h-4 w-4" />}>
              Profile Settings
            </DropdownMenuItem>
            {user?.systemRole === 'admin' && (
              <DropdownMenuItem onClick={() => navigate('/admin')} icon={<Settings className="h-4 w-4" />}>
                Admin
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => navigate('/invitations')} icon={<Mail className="h-4 w-4" />}>
              Invitations
              {invitations.length > 0 && (
                <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {invitations.length}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/billing')} icon={<CreditCard className="h-4 w-4" />}>
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setIsLogoutConfirmOpen(true)} icon={<LogOut className="h-4 w-4" />} destructive>
              Sign out
            </DropdownMenuItem>
          </DropdownMenu>
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
                <article
                  key={ws.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm transition-all hover:border-[var(--color-primary)] hover:shadow-md"
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
                  <div className="mt-6 flex flex-wrap items-center gap-2">
                    <Link
                      to={`/workspaces/${ws.id}`}
                      className="inline-flex items-center rounded-md bg-[var(--color-primary)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-primary)]/90"
                    >
                      Open <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                    {ws.currentUserRole === 'owner' && (
                      <Link
                        to={`/workspaces/${ws.id}/billing`}
                        className="inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm font-medium text-[var(--color-muted-foreground)] transition-colors hover:text-[var(--color-primary)]"
                      >
                        <WalletCards className="h-4 w-4" />
                        Billing
                      </Link>
                    )}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </main>
      <CreateWorkspaceModal />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          setIsLogoutConfirmOpen(false)
          logout()
        }}
        title="Sign out?"
        description="You will need to sign in again to access your workspaces."
        confirmText="Sign out"
        isDestructive
      />
    </div>
  )
}
