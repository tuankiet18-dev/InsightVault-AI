import {
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Search,
  Settings as SettingsIcon,
  Trash2,
  Upload,
  UserPlus,
} from 'lucide-react'
import { useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useWorkspace, useWorkspaces, useDeleteWorkspace } from '@/hooks/useWorkspaces'
import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { DropdownMenu, DropdownMenuItem } from '../ui/DropdownMenu'
import { SettingsModal } from '../settings/SettingsModal'
import { ConfirmModal } from '../ui/ConfirmModal'
import { Button } from '../ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

export function TopBar() {
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore()
  const { data: activeWs } = useWorkspace(activeWorkspaceId)
  const { data: workspaces } = useWorkspaces()
  const {
    explorerOpen,
    inspectorOpen,
    toggleExplorer,
    toggleInspector,
    openUploadModal,
    setCommandPaletteOpen,
  } = useUiStore()
  const { user, logout } = useAuthStore()
  const deleteWorkspaceMutation = useDeleteWorkspace()

  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isDeleteWsModalOpen, setIsDeleteWsModalOpen] = useState(false)
  const role = activeWs?.currentUserRole
  const canUpload = role === 'owner' || role === 'editor'
  const isOwner = role === 'owner'

  const handleDeleteWorkspace = () => {
    if (!activeWorkspaceId) return
    deleteWorkspaceMutation.mutate(activeWorkspaceId, {
      onSuccess: () => {
        setIsDeleteWsModalOpen(false)
        setActiveWorkspace(null)
      },
    })
  }

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={toggleExplorer}
        aria-label="Toggle explorer"
      >
        {explorerOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
      </Button>

      <Select
        value={activeWorkspaceId ?? undefined}
        onValueChange={setActiveWorkspace}
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

      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="mx-2 hidden h-8 max-w-xl flex-1 items-center justify-between rounded-md border border-border bg-background px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:bg-accent md:flex"
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span className="truncate">Search documents, chunks, reports...</span>
        </span>
        <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          Ctrl K
        </kbd>
      </button>

      {role && (
        <span className="hidden rounded-md border border-border bg-background px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground md:inline-flex">
          {role}
        </span>
      )}
      {isOwner && (
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
          <UserPlus className="h-4 w-4" />
          Invite
        </Button>
      )}
      {canUpload && (
        <Button size="sm" onClick={() => openUploadModal()} className="hidden sm:inline-flex">
          <Upload className="h-4 w-4" />
          Upload
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={toggleInspector}
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
        {isOwner && (
          <DropdownMenuItem onClick={() => setIsDeleteWsModalOpen(true)} icon={<Trash2 className="h-4 w-4" />} destructive>
            Delete workspace
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => logout()} icon={<LogOut className="h-4 w-4" />} destructive>
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
    </header>
  )
}
