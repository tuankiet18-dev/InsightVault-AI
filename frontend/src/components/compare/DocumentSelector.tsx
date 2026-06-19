import { useState } from 'react'
import { Check, File, Search } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useDocuments } from '@/hooks/useDocuments'
import { cn, getFileTypeColor } from '@/lib/utils'

export function DocumentSelector({ 
  selectedIds, 
  onChange,
  maxSelections = 5
}: { 
  selectedIds: string[], 
  onChange: (ids: string[]) => void,
  maxSelections?: number
}) {
  const { activeWorkspaceId } = useWorkspaceStore()
  const { data: documents = [] } = useDocuments(activeWorkspaceId)
  const [search, setSearch] = useState('')
  
  const completedDocs = documents.filter(d => d.status === 'completed' && d.folderId !== null)
  const filteredDocs = completedDocs.filter(d => 
    d.originalFileName.toLowerCase().includes(search.toLowerCase())
  )

  const toggleDocument = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter(i => i !== id))
    } else {
      if (maxSelections === 1) {
        onChange([id])
      } else if (selectedIds.length < maxSelections) {
        onChange([...selectedIds, id])
      }
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-0 border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="p-3 border-b border-border bg-surface-50">
        <div className="text-sm font-semibold text-surface-900 mb-2">Select Documents {maxSelections > 1 ? `(${selectedIds.length}/${maxSelections})` : ''}</div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search completed documents..."
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 bg-surface-0"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-1">
          {filteredDocs.map(doc => {
            const isSelected = selectedIds.includes(doc.id)
            return (
              <button
                key={doc.id}
                onClick={() => toggleDocument(doc.id)}
                className={cn(
                  "flex items-center gap-3 w-full p-2.5 rounded-lg text-left transition-colors group",
                  isSelected ? "bg-primary/10 ring-1 ring-primary/30 hover:bg-primary/15" : "hover:bg-surface-100"
                )}
                aria-pressed={isSelected}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-colors",
                  isSelected ? "bg-primary border-primary text-primary-foreground" : "border-surface-300 bg-surface-0 group-hover:border-primary"
                )}>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <File className={cn("w-3.5 h-3.5 shrink-0", getFileTypeColor(doc.fileType))} />
                    <span className={cn("text-sm font-medium truncate", isSelected ? "text-foreground" : "text-surface-700")}>
                      {doc.originalFileName}
                    </span>
                  </div>
                  {doc.summary && (
                    <div className="text-xs text-surface-500 line-clamp-1 mt-0.5 ml-5">
                      {doc.summary}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
