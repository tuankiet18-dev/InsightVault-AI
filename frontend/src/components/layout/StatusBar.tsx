import { useWorkspaceStore } from '@/stores/workspaceStore'

export function StatusBar() {
  const { getActiveWorkspace, jobs } = useWorkspaceStore()
  const activeWs = getActiveWorkspace()
  
  const processingCount = jobs.filter(j => j.status === 'processing').length
  const failedCount = jobs.filter(j => j.status === 'failed').length

  return (
    <footer className="ide-statusbar flex items-center justify-between px-3 h-6 bg-surface-800 text-surface-300 text-[11px] select-none shrink-0 z-30">
      <div className="flex items-center gap-4">
        <span>InsightVault AI MVP</span>
        {activeWs && (
          <>
            <span className="w-px h-3 bg-surface-600" />
            <span>Role: <strong className="text-surface-100">{activeWs.currentUserRole}</strong></span>
            <span className="w-px h-3 bg-surface-600" />
            <span>Retrieval: <span className="text-surface-100">permission-filtered</span></span>
          </>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        {processingCount > 0 && (
          <span className="text-warning-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-warning-500 animate-pulse" />
            {processingCount} processing
          </span>
        )}
        {failedCount > 0 && (
          <span className="text-danger-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-danger-500" />
            {failedCount} failed
          </span>
        )}
        <span className="w-px h-3 bg-surface-600" />
        <span>Gemini 1.5 Pro</span>
      </div>
    </footer>
  )
}
