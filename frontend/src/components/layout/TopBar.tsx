import { Search, UserPlus, Upload, ChevronDown } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useUiStore } from '@/stores/uiStore'

export function TopBar() {
  const { getActiveWorkspace } = useWorkspaceStore()
  const { setUploadModalOpen, setCommandPaletteOpen } = useUiStore()
  const activeWs = getActiveWorkspace()

  return (
    <header className="ide-topbar flex items-center justify-between px-4 h-12 bg-surface-50 border-b border-border z-10">
      <div className="flex items-center gap-2">
        <button className="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md hover:bg-surface-100 text-sm font-medium transition-colors">
          <span>{activeWs?.name || 'Select Workspace'}</span>
          <ChevronDown className="w-4 h-4 text-surface-400" />
        </button>
      </div>

      <div className="flex-1 max-w-lg mx-4">
        <button 
          onClick={() => setCommandPaletteOpen(true)}
          className="flex items-center justify-between w-full h-8 px-3 rounded-md border border-border bg-surface-100 hover:bg-surface-200 text-sm text-surface-500 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>Search or jump to...</span>
          </div>
          <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 font-mono text-[10px] font-medium bg-surface-0 border border-border rounded text-surface-400">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors">
          <UserPlus className="w-4 h-4" />
          <span>Invite</span>
        </button>
        <button 
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          <span>Upload</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-ai-500 flex items-center justify-center text-white font-medium ml-2 shadow-sm">
          M
        </div>
      </div>
    </header>
  )
}
