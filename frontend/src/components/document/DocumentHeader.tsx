import { FileBarChart2, GitCompare, FileText } from 'lucide-react'
import type { DocumentDto } from '@/types/api-contract'
import { StatusChip } from './StatusChip'

export function DocumentHeader({ document }: { document: DocumentDto }) {
  return (
    <header className="shrink-0 border-b border-border bg-card px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="min-w-0">
            <h1 className="text-sm font-semibold leading-5 tracking-tight text-foreground">{document.originalFileName}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip status={document.status} />
            <span className="hidden text-[11px] text-muted-foreground md:inline">Updated 2026-05-20</span>
          </div>
        </div>
        
        <div className="hidden shrink-0 items-center gap-1 sm:flex">
          <button 
            disabled={document.status !== 'completed'}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <GitCompare className="w-4 h-4" />
            Compare
          </button>
          
          <button
            disabled={document.status !== 'completed'}
            className="flex h-7 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileBarChart2 className="w-4 h-4" />
            Report
          </button>
        </div>
      </div>
    </header>
  )
}
