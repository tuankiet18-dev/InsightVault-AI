import { useState } from 'react'
import { Folder, File, Layers, ChevronDown } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { SCOPE_OPTIONS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function ChatScopeSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [scope, setScope] = useState<typeof SCOPE_OPTIONS[number]>('Workspace')
  const { getActiveWorkspace } = useWorkspaceStore()
  const activeWs = getActiveWorkspace()

  const getScopeIcon = () => {
    switch (scope) {
      case 'Workspace': return <Layers className="w-4 h-4" />
      case 'Folder': return <Folder className="w-4 h-4" />
      case 'Document': return <File className="w-4 h-4" />
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-surface-0 hover:bg-surface-50 text-sm font-medium text-surface-700 transition-colors shadow-sm"
      >
        <span className="text-surface-400">Scope:</span>
        <span className="flex items-center gap-1.5 text-primary-600">
          {getScopeIcon()}
          {scope}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-surface-400 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-64 bg-surface-0 border border-border rounded-xl shadow-lg z-50 p-1">
            <div className="px-2 py-1.5 text-xs font-semibold text-surface-500 uppercase tracking-wider">
              Retrieval Scope
            </div>
            <div className="flex flex-col gap-1 mt-1">
              {SCOPE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => {
                    setScope(opt)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex flex-col items-start px-2 py-1.5 rounded-lg text-sm text-left transition-colors",
                    scope === opt ? "bg-primary-50 text-primary-700" : "hover:bg-surface-100 text-surface-700"
                  )}
                >
                  <div className="flex items-center gap-1.5 font-medium">
                    {opt === 'Workspace' && <Layers className="w-4 h-4 shrink-0" />}
                    {opt === 'Folder' && <Folder className="w-4 h-4 shrink-0" />}
                    {opt === 'Document' && <File className="w-4 h-4 shrink-0" />}
                    {opt}
                  </div>
                  <span className={cn("text-xs mt-0.5", scope === opt ? "text-primary-600/70" : "text-surface-500")}>
                    {opt === 'Workspace' && `Search all documents in ${activeWs?.name}`}
                    {opt === 'Folder' && 'Select specific folders to search'}
                    {opt === 'Document' && 'Select specific documents to search'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
