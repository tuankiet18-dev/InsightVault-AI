import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Settings as SettingsIcon,
  Trash2,
  UserPlus,
  WalletCards,
  Mail,
  CreditCard,
} from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMyWorkspaceInvitations } from '@/hooks/useWorkspaceInvitations'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useWorkspace, useWorkspaces, useDeleteWorkspace } from '@/hooks/useWorkspaces'
import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { useTabStore } from '@/stores/tabStore'
import { useChatStore } from '@/stores/chatStore'
import { useAiStore } from '@/stores/aiStore'
import { DropdownMenu, DropdownMenuItem } from '../ui/DropdownMenu'
import { SettingsModal } from '../settings/SettingsModal'
import { ConfirmModal } from '../ui/ConfirmModal'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { GlobalSearch } from '../search/GlobalSearch'

export function TopBar() {
  const navigate = useNavigate()
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore()
  const { data: activeWs } = useWorkspace(activeWorkspaceId)
  const { data: workspaces } = useWorkspaces()
  const {
    explorerOpen,
    inspectorOpen,
    toggleExplorer,
    toggleInspector,
    setInviteModalOpen,
    setMobileDrawer,
  } = useUiStore()
  const { user, logout } = useAuthStore()
  const deleteWorkspaceMutation = useDeleteWorkspace()
  const { data: invitations = [] } = useMyWorkspaceInvitations()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isDeleteWsModalOpen, setIsDeleteWsModalOpen] = useState(false)
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false)
  const role = activeWs?.currentUserRole

  const isOwner = role === 'owner'

  const handleInviteClick = () => {
    setInviteModalOpen(true)
  }

  const handleDeleteWorkspace = () => {
    if (!activeWorkspaceId) return
    deleteWorkspaceMutation.mutate(activeWorkspaceId, {
      onSuccess: () => {
        setIsDeleteWsModalOpen(false)
        setActiveWorkspace(null)
      },
    })
  }

  const openExplorer = () => {
    if (window.innerWidth < 1024) {
      setMobileDrawer('explorer')
      return
    }

    toggleExplorer()
  }

  const openInspector = () => {
    if (window.innerWidth < 1280) {
      setMobileDrawer('inspector')
      return
    }

    toggleInspector()
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={openExplorer}
        aria-label="Toggle explorer"
      >
        {explorerOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </Button>

      <Select
        value={activeWorkspaceId ?? undefined}
        onValueChange={(val) => {
          setActiveWorkspace(val)
          useTabStore.getState().resetTabs()
          useChatStore.getState().setActiveSession(null)
          useAiStore.getState().setAnswer(null)
          useAiStore.getState().setCitations([])
          navigate(`/workspaces/${val}`)
        }}
        disabled={!workspaces?.length}
      >
        <SelectTrigger className="h-8 w-[170px] bg-background text-sm sm:w-[210px]">
          <SelectValue placeholder={activeWs?.name || 'Select workspace'} />
        </SelectTrigger>
        <SelectContent align="start">
          {workspaces?.map((ws) => (
            <SelectItem key={ws.id} value={ws.id}>
              {ws.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <GlobalSearch />

      {role && (
        <span className="hidden rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground md:inline-flex">
          {role}
        </span>
      )}
      {isOwner && (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={() => navigate('/billing')}
          >
            <WalletCards className="h-4 w-4" />
            Billing
          </Button>
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={handleInviteClick}>
            <UserPlus className="h-4 w-4" />
            Invite
          </Button>
        </>
      )}

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={openInspector}
        aria-label="Toggle AI inspector"
      >
        {inspectorOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
      </Button>

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
        <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} icon={<SettingsIcon className="h-4 w-4" />}>
          Profile Settings
        </DropdownMenuItem>
        {user?.systemRole === 'admin' && (
          <DropdownMenuItem onClick={() => navigate('/admin')} icon={<SettingsIcon className="h-4 w-4" />}>
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
        {isOwner && (
          <DropdownMenuItem onClick={() => setIsDeleteWsModalOpen(true)} icon={<Trash2 className="h-4 w-4" />} destructive>
            Delete workspace
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => setIsLogoutConfirmOpen(true)} icon={<LogOut className="h-4 w-4" />} destructive>
          Log out
        </DropdownMenuItem>
      </DropdownMenu>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      <ConfirmModal
        isOpen={isDeleteWsModalOpen}
        onClose={() => setIsDeleteWsModalOpen(false)}
        onConfirm={handleDeleteWorkspace}
        isLoading={deleteWorkspaceMutation.isPending}
        title="Delete Workspace?"
        description={`Are you sure you want to delete workspace "${activeWs?.name}"? All folders, documents, and reports inside this workspace will be permanently removed.`}
        confirmText="Delete Workspace"
      />
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        onClose={() => setIsLogoutConfirmOpen(false)}
        onConfirm={() => {
          setIsLogoutConfirmOpen(false)
          logout()
        }}
        title="Log out?"
        description="You will need to sign in again to access this workspace."
        confirmText="Log out"
        isDestructive
      />
    </header>
  )
}
