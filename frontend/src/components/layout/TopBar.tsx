import { Search, UserPlus, ChevronDown, Plus, LogOut, Settings as SettingsIcon, Edit2, Trash2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useWorkspace, useWorkspaces, useDeleteWorkspace } from '@/hooks/useWorkspaces'
import { useUiStore } from '@/stores/uiStore'
import { useAuthStore } from '@/stores/authStore'
import { DropdownMenu, DropdownMenuItem } from '../ui/DropdownMenu'
import { SettingsModal } from '../settings/SettingsModal'
import { ConfirmModal } from '../ui/ConfirmModal'
import { toast } from 'sonner'

export function TopBar() {
  const { activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore()
  const { data: activeWs } = useWorkspace(activeWorkspaceId)
  const { data: workspaces } = useWorkspaces()
  const { setCommandPaletteOpen, setCreateWorkspaceModalOpen } = useUiStore()
  const { user, logout } = useAuthStore()
  const deleteWorkspaceMutation = useDeleteWorkspace()
  
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isDeleteWsModalOpen, setIsDeleteWsModalOpen] = useState(false)
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

  const handleDeleteWorkspace = () => {
    if (!activeWorkspaceId) return
    deleteWorkspaceMutation.mutate(activeWorkspaceId, {
      onSuccess: () => {
        setIsDeleteWsModalOpen(false)
        setActiveWorkspace(null)
      }
    })
  }

  return (
    <header className="ide-topbar flex items-center justify-between px-4 h-12 bg-surface-50 border-b border-border z-10">
      <div className="flex items-center gap-2 relative" ref={dropdownRef}>
        <div className="flex items-center">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md hover:bg-surface-100 text-sm font-medium transition-colors"
          >
            <span>{activeWs?.name || 'Select Workspace'}</span>
            <ChevronDown className="w-4 h-4 text-surface-400" />
          </button>
          
          {activeWs && (
            <DropdownMenu align="left">
              <DropdownMenuItem onClick={() => toast.info('Rename workspace coming soon')} icon={<Edit2 className="w-4 h-4" />}>
                Rename Workspace
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeleteWsModalOpen(true)} icon={<Trash2 className="w-4 h-4" />} destructive>
                Delete Workspace
              </DropdownMenuItem>
            </DropdownMenu>
          )}
        </div>
        
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
        <DropdownMenu
          trigger={
            <button className="w-8 h-8 rounded-full bg-ai-500 hover:bg-ai-600 transition-colors flex items-center justify-center text-white font-medium ml-2 shadow-sm overflow-hidden">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName || 'User'} className="w-full h-full object-cover" />
              ) : (
                <span>{user?.fullName?.charAt(0) || 'U'}</span>
              )}
            </button>
          }
        >
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm font-medium text-surface-900">{user?.fullName}</p>
            <p className="text-xs text-surface-500 truncate">{user?.email}</p>
          </div>
          <DropdownMenuItem onClick={() => setIsSettingsOpen(true)} icon={<SettingsIcon className="w-4 h-4" />}>
            Profile Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => logout()} icon={<LogOut className="w-4 h-4" />} destructive>
            Log out
          </DropdownMenuItem>
        </DropdownMenu>
      </div>

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
