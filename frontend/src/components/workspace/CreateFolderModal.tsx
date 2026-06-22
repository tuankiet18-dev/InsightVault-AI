import { X, Info } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { useState } from 'react'
import { useCreateFolder } from '@/hooks/useFolders'
import { useWorkspaceStore } from '@/stores/workspaceStore'

export function CreateFolderModal() {
  const { createFolderModalOpen, closeCreateFolderModal, createFolderTargetParentId } = useUiStore()
  const { activeWorkspaceId } = useWorkspaceStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  
  // hook handles invalidation of folder list automatically
  const createMutation = useCreateFolder(activeWorkspaceId!)

  if (!createFolderModalOpen) return null

  const resetAndClose = () => {
    closeCreateFolderModal()
    setTimeout(() => {
      setName('')
      setDescription('')
    }, 300)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !activeWorkspaceId) return

    createMutation.mutate(
      { name: name.trim(), description: description.trim(), parentFolderId: createFolderTargetParentId || null },
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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={resetAndClose}
      />
      
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <header className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-card-foreground">
            {createFolderTargetParentId ? 'Create Subfolder' : 'Create Folder'}
          </h2>
          <button 
            type="button"
            onClick={resetAndClose}
            className="p-1.5 text-muted-foreground hover:text-card-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 pt-5">
          <div className="mb-5 rounded-lg bg-[var(--color-primary)]/10 p-3 text-sm text-[var(--color-primary)] border border-[var(--color-primary)]/20 flex gap-2.5">
            <Info className="h-4 w-4 shrink-0 mt-0.5 opacity-80" />
            <p className="leading-relaxed">
              Create a folder to organize your uploaded documents and reports. You can also mention (<strong>@</strong>) this folder in the AI Assistant to narrow down the chat context.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="folder-name" className="block text-sm font-medium text-card-foreground mb-1.5">
                Folder Name <span className="text-danger-500">*</span>
              </label>
              <input
                id="folder-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q3 Financial Reports"
                className="w-full h-10 px-3 rounded-lg border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                autoFocus
                required
              />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground mr-1 uppercase font-semibold tracking-wider">Suggestions:</span>
                {['Research', 'Meeting Notes', 'Requirements', 'Specs'].map(s => (
                  <button 
                    key={s} 
                    type="button" 
                    onClick={() => setName(s)}
                    className="text-[11px] bg-surface-100 hover:bg-surface-200 text-surface-700 px-2 py-0.5 rounded transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="folder-desc" className="block text-sm font-medium text-card-foreground mb-1.5">
                Description <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <textarea
                id="folder-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the purpose of this folder..."
                className="w-full p-3 rounded-lg border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px] resize-y"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button 
              type="button"
              onClick={resetAndClose}
              disabled={createMutation.isPending}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={createMutation.isPending || !name.trim()}
              className="px-6 py-2 rounded-lg text-sm font-medium bg-primary/100 text-white hover:bg-primary transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {createMutation.isPending && (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              )}
              {createMutation.isPending ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
