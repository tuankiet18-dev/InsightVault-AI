import { FolderTree } from './FolderTree'
import { TrashSection } from './TrashSection'
import { useEffect } from 'react'
import { ChevronDown, Plus, FolderPlus } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useUiStore } from '@/stores/uiStore'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { hasPermission } from '@/utils/permission'

export function ExplorerPanel() {
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore()
  const { data: workspaces = [] } = useWorkspaces()
  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId) ?? workspaces[0]
  const { setCreateWorkspaceModalOpen, openCreateFolderModal } = useUiStore()

  useEffect(() => {
    if (!activeWorkspaceId && workspaces.length > 0) {
      setActiveWorkspace(workspaces[0].id)
    }
  }, [activeWorkspaceId, setActiveWorkspace, workspaces])

  const canEdit = hasPermission(activeWorkspace?.currentUserRole, 'upload_document')

  return (
    <aside className="flex h-full w-full min-h-0 flex-col border-r border-border bg-card">
      <div className="flex h-9 items-center justify-between border-b border-border px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Explorer
        </span>
        <button
          onClick={() => setCreateWorkspaceModalOpen(true)}
          className="rounded p-1 text-surface-500 transition-colors hover:bg-surface-200 hover:text-surface-900"
          title="New Workspace"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="mb-1 flex w-full items-center justify-between gap-1.5 rounded px-1 text-left group">
          <button className="flex-1 flex items-center gap-1.5 py-1 text-sm font-semibold text-foreground hover:bg-accent rounded">
            <ChevronDown className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{activeWorkspace?.name ?? 'Workspace'}</span>
          </button>
          {canEdit && (
            <button
              onClick={() => openCreateFolderModal()}
              className="shrink-0 rounded p-1 opacity-0 text-surface-500 transition-all hover:bg-surface-200 hover:text-surface-900 group-hover:opacity-100"
              title="New Folder"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <FolderTree />
        <TrashSection />
      </div>
    </aside>
  )
}
