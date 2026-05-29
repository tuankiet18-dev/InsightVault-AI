import { SplitSquareHorizontal, GitCompare, Sparkles } from 'lucide-react'
import type { DocumentDto } from '@/types/api-contract'
import { StatusChip } from './StatusChip'
import { cn } from '@/lib/utils'

export function DocumentHeader({ document }: { document: DocumentDto }) {
  return (
    <header className="px-6 py-4 border-b border-border bg-surface-0 shrink-0">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] font-medium text-surface-400 uppercase tracking-wider mb-1">
            Project Documents / uploaded by user / ready for workspace AI
          </div>
          <h1 className="text-xl font-bold text-surface-900 mb-3">{document.originalFileName}</h1>
          
          <div className="flex items-center gap-2 flex-wrap">
            <StatusChip status={document.status} />
            {document.status === 'completed' && (
              <>
                <StatusChip label="RAG ready" variant="info" />
                <StatusChip label="Summary generated" variant="ai" />
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-surface-600 border border-border hover:bg-surface-100 transition-colors shadow-sm">
            <SplitSquareHorizontal className="w-4 h-4" />
            Open split
          </button>
          
          <button 
            disabled={document.status !== 'completed'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-surface-600 border border-border hover:bg-surface-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <GitCompare className="w-4 h-4" />
            Compare
          </button>
          
          <button 
            disabled={document.status !== 'completed'}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium shadow-sm transition-colors",
              document.status === 'completed' 
                ? "bg-ai-500 text-white hover:bg-ai-600" 
                : "bg-surface-100 text-surface-400 cursor-not-allowed"
            )}
          >
            <Sparkles className="w-4 h-4" />
            Ask AI
          </button>
        </div>
      </div>
    </header>
  )
}
