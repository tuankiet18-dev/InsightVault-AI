import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useWorkspaces } from '@/hooks/useWorkspaces'
import { useUiStore } from '@/stores/uiStore'
import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

export function WorkspaceList() {
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore()
  const { data: workspaces = [] } = useWorkspaces()
  const { setCreateWorkspaceModalOpen } = useUiStore()

  return (
    <section className="px-3 py-4">
      <div className="mb-2 px-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
          Vaults
        </span>
        <button
          onClick={() => setCreateWorkspaceModalOpen(true)}
          className="p-1 rounded hover:bg-surface-200 text-surface-500 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {workspaces.length === 0 ? (
        <div className="px-2 py-4 text-center">
          <p className="text-xs text-surface-400 mb-3">No workspaces found</p>
          <button 
            onClick={() => setCreateWorkspaceModalOpen(true)}
            className="w-full py-1.5 px-3 rounded-md border border-dashed border-border text-xs font-medium text-surface-500 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-colors"
          >
            Create your first vault
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => setActiveWorkspace(ws.id)}
              className={cn(
                "flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm text-left transition-colors",
                activeWorkspaceId === ws.id 
                  ? "bg-primary-50 text-primary-700 font-medium" 
                  : "text-surface-600 hover:bg-surface-100"
              )}
            >
              <span className="truncate">{ws.name}</span>
              <span className="text-[10px] font-mono uppercase text-surface-400 shrink-0">
                {ws.currentUserRole}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
