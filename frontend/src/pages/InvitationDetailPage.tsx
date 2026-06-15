import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Clock, LogOut, Mail, Shield, UserPlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/stores/authStore'
import {
  useAcceptWorkspaceInvitation,
  useDeclineWorkspaceInvitation,
  useMyWorkspaceInvitation,
} from '@/hooks/useWorkspaceInvitations'

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))

export function InvitationDetailPage() {
  const { invitationId } = useParams()
  const { user, logout } = useAuthStore()
  const { data: invitation, isLoading, error } = useMyWorkspaceInvitation(invitationId)
  const acceptMutation = useAcceptWorkspaceInvitation()
  const declineMutation = useDeclineWorkspaceInvitation()

  const activeInvitation =
    acceptMutation.data?.id === invitationId
      ? acceptMutation.data
      : declineMutation.data?.id === invitationId
        ? declineMutation.data
        : invitation

  const isPending = activeInvitation?.status === 'pending'
  const isBusy = acceptMutation.isPending || declineMutation.isPending

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-foreground)]">
      <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)]/80 px-6 backdrop-blur-md">
        <Link to="/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-ai)] font-bold text-white shadow-sm">
            IV
          </div>
          <span className="font-semibold">InsightVault</span>
        </Link>
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

      <main className="mx-auto flex max-w-3xl flex-col px-6 py-10">
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-8 w-fit">
          <Link to="/invitations">
            <ArrowLeft className="h-4 w-4" />
            Invitations
          </Link>
        </Button>

        {isLoading ? (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-sm text-[var(--color-muted-foreground)]">
            Loading invitation...
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-sm font-medium text-red-700">
            {(error as Error).message || 'Invitation not found.'}
          </div>
        ) : activeInvitation ? (
          <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center shadow-sm">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <UserPlus className="h-7 w-7" />
            </div>

            <Badge variant={activeInvitation.status === 'pending' ? 'secondary' : 'outline'} className="mb-4 capitalize">
              {activeInvitation.status}
            </Badge>

            <h1 className="mx-auto max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">
              {activeInvitation.invitedByName || 'A teammate'} invited you to collaborate on {activeInvitation.workspaceName}
            </h1>

            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-[var(--color-muted-foreground)]">
              <span className="flex items-center gap-1.5 rounded-md bg-[var(--color-secondary)] px-3 py-1.5">
                <Mail className="h-4 w-4" />
                {activeInvitation.email}
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-[var(--color-secondary)] px-3 py-1.5 capitalize">
                <Shield className="h-4 w-4" />
                {activeInvitation.role}
              </span>
              <span className="flex items-center gap-1.5 rounded-md bg-[var(--color-secondary)] px-3 py-1.5">
                <Clock className="h-4 w-4" />
                Expires {formatDate(activeInvitation.expiresAt)}
              </span>
            </div>

            <div className="my-8 h-px bg-[var(--color-border)]" />

            {isPending ? (
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  type="button"
                  disabled={isBusy}
                  onClick={() => acceptMutation.mutate(activeInvitation.id)}
                >
                  <Check className="h-4 w-4" />
                  Accept invitation
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => declineMutation.mutate(activeInvitation.id)}
                >
                  <X className="h-4 w-4" />
                  Decline
                </Button>
              </div>
            ) : activeInvitation.status === 'accepted' ? (
              <Button asChild>
                <Link to={`/workspaces/${activeInvitation.workspaceId}`}>Open workspace</Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to="/dashboard">Back to dashboard</Link>
              </Button>
            )}
          </section>
        ) : null}
      </main>
    </div>
  )
}
