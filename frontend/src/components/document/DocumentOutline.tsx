import type { DocumentDto } from '@/types/api-contract'
import { AlignLeft } from 'lucide-react'

export function DocumentOutline({ document }: { document: DocumentDto }) {
  if (document.status !== 'completed') return null

  return (
    <aside className="w-48 shrink-0 border-l border-border pl-4 py-1 hidden lg:block">
      <div className="flex items-center gap-1.5 text-xs font-semibold text-surface-500 uppercase tracking-wider mb-4">
        <AlignLeft className="w-3.5 h-3.5" />
        Outline
      </div>
      
      <nav className="flex flex-col gap-1.5 text-sm">
        {document.summary && (
          <a href="#ai-summary" className="text-surface-600 hover:text-primary-600 hover:underline transition-colors">
            AI Summary
          </a>
        )}
        
        {document.keyPoints.length > 0 && (
          <a href="#key-points" className="text-surface-600 hover:text-primary-600 hover:underline transition-colors">
            Key Findings
          </a>
        )}
        
        {document.keywords.length > 0 && (
          <a href="#keywords" className="text-surface-600 hover:text-primary-600 hover:underline transition-colors">
            Keywords
          </a>
        )}
      </nav>
    </aside>
  )
}
