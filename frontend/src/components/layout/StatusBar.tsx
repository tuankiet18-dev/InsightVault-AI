import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useWorkspace } from '@/hooks/useWorkspaces'
import { useDocuments } from '@/hooks/useDocuments'

export function StatusBar() {
  const { activeWorkspaceId } = useWorkspaceStore()
  const { data: activeWs } = useWorkspace(activeWorkspaceId)
  const { data: documents = [] } = useDocuments(activeWorkspaceId)
  
  const processingCount = documents.filter(d => d.status === 'processing' || d.status === 'uploaded' || d.status === 'pending_upload').length
  const failedCount = documents.filter(d => d.status === 'failed').length

  return (
    <footer className="ide-statusbar flex items-center justify-between px-3 h-6 bg-surface-800 text-surface-300 text-[11px] select-none shrink-0 z-30">
      <div className="flex items-center gap-4">
        <span>InsightVault AI MVP</span>
        {activeWs && (
          <>
            <span className="w-px h-3 bg-surface-600" />
            <span>Role: <strong className="text-white">{activeWs.currentUserRole}</strong></span>
            <span className="w-px h-3 bg-surface-600" />
            <span>Retrieval: <span className="text-white">permission-filtered</span></span>
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
        <span>Gemini 3.5 Flash</span>
      </div>
    </footer>
  )
}
