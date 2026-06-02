import { X } from 'lucide-react'
import { useUiStore } from '@/stores/uiStore'
import { useState } from 'react'
import { useCreateWorkspace } from '@/hooks/useWorkspaces'
import { useWorkspaceStore } from '@/stores/workspaceStore'

export function CreateWorkspaceModal() {
  const { createWorkspaceModalOpen, setCreateWorkspaceModalOpen } = useUiStore()
  const { setActiveWorkspace } = useWorkspaceStore()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  
  const createMutation = useCreateWorkspace()

  if (!createWorkspaceModalOpen) return null

  const resetAndClose = () => {
    setCreateWorkspaceModalOpen(false)
    setTimeout(() => {
      setName('')
      setDescription('')
    }, 300)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    createMutation.mutate(
      { name: name.trim(), description: description.trim() },
      {
        onSuccess: (newWorkspace) => {
          setActiveWorkspace(newWorkspace.id)
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
          <h2 className="text-lg font-bold text-card-foreground">Create Workspace</h2>
          <button 
            type="button"
            onClick={resetAndClose}
            className="p-1.5 text-muted-foreground hover:text-card-foreground hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="ws-name" className="block text-sm font-medium text-card-foreground mb-1.5">
                Workspace Name <span className="text-danger-500">*</span>
              </label>
              <input
                id="ws-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Q3 Marketing Campaign"
                className="w-full h-10 px-3 rounded-lg border border-border bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
                required
              />
            </div>
            
            <div>
              <label htmlFor="ws-desc" className="block text-sm font-medium text-card-foreground mb-1.5">
                Description <span className="text-muted-foreground font-normal">(Optional)</span>
              </label>
              <textarea
                id="ws-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the purpose of this workspace..."
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
              {createMutation.isPending ? 'Creating...' : 'Create Workspace'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
