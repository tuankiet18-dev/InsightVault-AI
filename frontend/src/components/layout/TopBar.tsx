import { Search, UserPlus, ChevronDown, Plus } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useWorkspace, useWorkspaces } from '@/hooks/useWorkspaces'
import { useUiStore } from '@/stores/uiStore'

export function TopBar() {
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore()
  const { data: activeWs } = useWorkspace(activeWorkspaceId)
  const { data: workspaces } = useWorkspaces()
  const { setCommandPaletteOpen, setCreateWorkspaceModalOpen } = useUiStore()
  
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="ide-topbar flex items-center justify-between px-4 h-12 bg-surface-50 border-b border-border z-10">
      <div className="flex items-center gap-2 relative" ref={dropdownRef}>
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md hover:bg-surface-100 text-sm font-medium transition-colors"
        >
          <span>{activeWs?.name || 'Select Workspace'}</span>
          <ChevronDown className="w-4 h-4 text-surface-400" />
        </button>
        
        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-surface-0 border border-border rounded-lg shadow-lg py-1 z-50">
            <div className="px-3 py-2 text-xs font-semibold text-surface-400 uppercase tracking-wider">
              Workspaces
            </div>
            <div className="max-h-60 overflow-y-auto">
              {workspaces?.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => {
                    setActiveWorkspace(ws.id)
                    setDropdownOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-surface-100 transition-colors ${
                    activeWorkspaceId === ws.id ? 'text-primary-600 font-medium bg-primary-50' : 'text-surface-700'
                  }`}
                >
                  {ws.name}
                </button>
              ))}
            </div>
            <div className="border-t border-border mt-1 pt-1">
              <button
                onClick={() => {
                  setCreateWorkspaceModalOpen(true)
                  setDropdownOpen(false)
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-surface-700 hover:bg-surface-100 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create new workspace
              </button>
            </div>
          </div>
        )}
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
        <div className="w-8 h-8 rounded-full bg-ai-500 flex items-center justify-center text-white font-medium ml-2 shadow-sm">
          M
        </div>
      </div>
    </header>
  )
}
