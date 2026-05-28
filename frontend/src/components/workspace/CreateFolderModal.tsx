import { X } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { useState } from 'react'
import { useCreateFolder } from '@/hooks/useFolders'
import { useWorkspaceStore } from '@/stores/workspaceStore'

export function CreateFolderModal() {
  const { createFolderModalOpen, setCreateFolderModalOpen } = useUiStore()
  const { activeWorkspaceId } = useWorkspaceStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  
  // hook handles invalidation of folder list automatically
  const createMutation = useCreateFolder(activeWorkspaceId!)

  if (!createFolderModalOpen) return null

  const resetAndClose = () => {
    setCreateFolderModalOpen(false)
    setTimeout(() => {
      setName('')
      setDescription('')
    }, 300)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !activeWorkspaceId) return

    createMutation.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: () => {
          resetAndClose()
        }
      }
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="absolute inset-0 bg-surface-900/50 backdrop-blur-sm"
        onClick={resetAndClose}
      />
      
      <div className="relative bg-surface-0 rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <header className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-surface-900">Create Folder</h2>
          <button 
            type="button"
            onClick={resetAndClose}
            className="p-1.5 text-surface-500 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="folder-name" className="block text-sm font-medium text-surface-900 mb-1.5">
                Folder Name <span className="text-danger-500">*</span>
              </label>
              <input
                id="folder-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q3 Financial Reports"
                className="w-full h-10 px-3 rounded-lg border border-border bg-surface-0 text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                autoFocus
                required
              />
            </div>
            
            <div>
              <label htmlFor="folder-desc" className="block text-sm font-medium text-surface-900 mb-1.5">
                Description <span className="text-surface-400 font-normal">(Optional)</span>
              </label>
              <textarea
                id="folder-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the purpose of this folder..."
                className="w-full p-3 rounded-lg border border-border bg-surface-0 text-surface-900 focus:outline-none focus:ring-2 focus:ring-primary-500/50 min-h-[100px] resize-y"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button 
              type="button"
              onClick={resetAndClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium text-surface-600 hover:bg-surface-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createMutation.isPending && (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              )}
              {createMutation.isPending ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
