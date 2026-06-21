import { FileBarChart2, GitCompare, FileText, Maximize2, Minimize2, MoreVertical, ExternalLink, Download } from 'lucide-react'
import type { DocumentDto } from '@/types/api-contract'
import { StatusChip } from './StatusChip'
import { useAiStore } from '@/stores/aiStore'
import { useTabStore } from '@/stores/tabStore'
import { useUiStore } from '@/stores/uiStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useDocumentOriginalAccess } from '@/hooks/useDocuments'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type { DocumentViewMode } from './DocumentViewer'

const viewModes: Array<{ value: DocumentViewMode; label: string }> = [
  { value: 'original', label: 'Original' },
  { value: 'extracted', label: 'Extracted Text' },
  { value: 'chunks', label: 'Chunks' },
  { value: 'summary', label: 'AI Summary' },
]

export function DocumentHeader({ 
  document,
  viewMode,
  setViewMode
}: { 
  document: DocumentDto
  viewMode: DocumentViewMode
  setViewMode: (mode: DocumentViewMode) => void
}) {
  const { openTab } = useTabStore()
  const { setScope } = useAiStore()
  const { inspectorOpen, focusMode, setFocusMode, setActiveNavItem, toggleInspector } = useUiStore()
  const { setSelectedDocument } = useWorkspaceStore()
  
  const accessQuery = useDocumentOriginalAccess(document.id)
  const accessUrl = accessQuery.data?.downloadUrl

  const startCompare = () => {
    openTab({
      id: 'compare-workspace',
      label: 'Compare',
      type: 'compare',
      closable: true,
    })
  }

  const prepareReport = () => {
    setSelectedDocument(document.id)
    setScope('document')
    setActiveNavItem('chat')
    if (!inspectorOpen) {
      toggleInspector()
    }
  }

  return (
    <header className="shrink-0 border-b border-border bg-surface-0 px-4 py-2 grid grid-cols-[1fr_auto_1fr] items-center gap-4 z-10">
      {/* Left section */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
        <h1 className="text-sm font-semibold leading-5 tracking-tight text-foreground truncate">{document.originalFileName}</h1>
        {document.status !== 'completed' && <StatusChip status={document.status} />}
      </div>
      
      {/* Center section */}
      <div className="hidden md:flex justify-center">
        <div className="inline-flex items-center rounded-full bg-muted p-0.5 shadow-sm" aria-label="Document view">
          {viewModes.map((mode) => (
            <button
              key={mode.value}
              type="button"
              onClick={() => setViewMode(mode.value)}
              aria-pressed={viewMode === mode.value}
              className={cn(
                "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200",
                viewMode === mode.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right section */}
      <div className="flex flex-1 items-center justify-end gap-1">
        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          <button 
            disabled={document.status !== 'completed'}
            onClick={startCompare}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GitCompare className="w-4 h-4" />
            Compare
          </button>
          
          <button
            disabled={document.status !== 'completed'}
            onClick={prepareReport}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileBarChart2 className="w-4 h-4" />
            Report
          </button>
          
          <div className="mx-1 h-4 w-px bg-border" />
          
          <button
            onClick={() => setFocusMode(!focusMode)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
            title={focusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
          >
            {focusMode ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          
          {accessUrl && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem asChild>
                  <a href={accessUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2 cursor-pointer">
                    <ExternalLink className="h-4 w-4" />
                    <span>Open in new tab</span>
                  </a>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <a href={accessUrl} download className="flex items-center gap-2 cursor-pointer">
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}
