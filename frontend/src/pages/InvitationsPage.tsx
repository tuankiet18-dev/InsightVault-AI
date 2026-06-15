import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Clock, Inbox, LogOut, Mail, Shield, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import {
  useAcceptWorkspaceInvitation,
  useDeclineWorkspaceInvitation,
  useMyWorkspaceInvitations,
} from '@/hooks/useWorkspaceInvitations'
import type { WorkspaceInvitationDto } from '@/types/api'

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

function InvitationActions({ invitation }: { invitation: WorkspaceInvitationDto }) {
  const acceptMutation = useAcceptWorkspaceInvitation()
  const declineMutation = useDeclineWorkspaceInvitation()
  const isBusy = acceptMutation.isPending || declineMutation.isPending

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      <Button
        type="button"
        size="sm"
        disabled={isBusy}
        onClick={() => acceptMutation.mutate(invitation.id)}
      >
        <Check className="h-4 w-4" />
        Accept
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={isBusy}
        onClick={() => declineMutation.mutate(invitation.id)}
      >
        <X className="h-4 w-4" />
        Decline
      </Button>
    </div>
  )
}

export function InvitationsPage() {
  const { user, logout } = useAuthStore()
  const { data: invitations = [], isLoading, error } = useMyWorkspaceInvitations()

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-ai)] font-bold text-white shadow-sm">
              IV
            </div>
            <span className="font-semibold">InsightVault</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2 text-sm text-[var(--color-muted-foreground)] sm:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary)]">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <span>{user?.fullName}</span>
          </div>
          <button onClick={logout} className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10">
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button asChild variant="ghost" size="sm" className="-ml-3 mb-3">
              <Link to="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Workspace invitations</h1>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              Pending invitations sent to {user?.email || 'your account'}.
            </p>
          </div>
          <Badge variant="secondary" className="w-fit">
            {invitations.length} pending
          </Badge>
        </div>

        {isLoading ? (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-sm text-[var(--color-muted-foreground)]">
            Loading invitations...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-sm font-medium text-red-700">
            {(error as Error).message || 'Failed to load invitations.'}
          </div>
        ) : invitations.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-10 text-center">
            <Inbox className="mx-auto mb-3 h-10 w-10 text-[var(--color-muted-foreground)]" />
            <h2 className="text-lg font-semibold">No pending invitations</h2>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              New workspace invitations will appear here until they expire or you respond.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex flex-col gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Mail className="h-4 w-4 text-[var(--color-primary)]" />
                    <Link
                      to={`/invitations/${invitation.id}`}
                      className="truncate text-base font-semibold hover:text-[var(--color-primary)]"
                    >
                      {invitation.workspaceName}
                    </Link>
                    <Badge variant="outline" className="capitalize">
                      {invitation.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--color-muted-foreground)]">
                    <span className="flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      {invitation.role}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Expires {formatDate(invitation.expiresAt)}
                    </span>
                  </div>
                  {invitation.invitedByName && (
                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                      Invited by {invitation.invitedByName}
                    </p>
                  )}
                </div>
                <InvitationActions invitation={invitation} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
