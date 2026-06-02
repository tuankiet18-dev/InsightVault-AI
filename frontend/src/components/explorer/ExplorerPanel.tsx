import { FolderTree } from './FolderTree'
import { useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useWorkspaces } from '@/hooks/useWorkspaces'

export function ExplorerPanel() {
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore()
  const { data: workspaces = [] } = useWorkspaces()
  const activeWorkspace = workspaces.find((ws) => ws.id === activeWorkspaceId) ?? workspaces[0]

  useEffect(() => {
    if (!activeWorkspaceId && workspaces.length > 0) {
      setActiveWorkspace(workspaces[0].id)
    }
  }, [activeWorkspaceId, setActiveWorkspace, workspaces])

  return (
    <aside className="flex h-full w-full min-h-0 flex-col border-r border-border bg-card">
      <div className="flex h-9 items-center justify-between border-b border-border px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Explorer
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <button className="mb-1 flex w-full items-center gap-1.5 rounded px-1 py-1 text-left text-sm font-semibold text-foreground hover:bg-accent">
          <ChevronDown className="h-3.5 w-3.5" />
          <span className="truncate">{activeWorkspace?.name ?? 'Workspace'}</span>
        </button>
        <FolderTree />
      </div>
    </aside>
  )
}
