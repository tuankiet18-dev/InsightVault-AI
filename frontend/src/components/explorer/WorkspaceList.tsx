import { useWorkspaceStore } from '@/stores/workspaceStore'
import { cn } from '@/lib/utils'

export function WorkspaceList() {
  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore()

  return (
    <section className="px-3 py-4">
      <div className="mb-2 px-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">
        Vaults
      </div>
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
    </section>
  )
}
