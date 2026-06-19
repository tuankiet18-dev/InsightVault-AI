import { useAiStore } from '@/stores/aiStore'
import { useTabStore } from '@/stores/tabStore'
import { FileText, ChevronRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createDocumentTab } from '@/lib/documentTabs'

export function AiAnswer() {
  const { answer, citations, suggestions, setMode, setPrompt } = useAiStore()
  const { openTab } = useTabStore()

  if (!answer) return null

  return (
    <div className="mt-3 flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Answer</h3>
        <div className="prose prose-sm prose-slate max-w-none rounded-lg border border-border bg-surface-0 p-3 text-surface-700 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{answer}</ReactMarkdown>
        </div>
      </section>

      {citations.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
            Sources
          </h3>
          <div className="flex flex-col gap-2">
            {citations.map((c, i) => (
              <button 
                key={i} 
                type="button"
                onClick={() => openTab(
                  createDocumentTab({
                    documentId: c.documentId,
                    fileName: c.fileName,
                    snippet: c.snippet,
                    documentChunkId: c.documentChunkId,
                    chunkIndex: c.chunkIndex,
                    pageNumber: c.pageNumber,
                  })
                )}
                className="group flex flex-col rounded-lg border border-border bg-surface-0 p-2.5 text-left transition-all hover:border-ai-300"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-surface-900">
                    <FileText className="w-3.5 h-3.5 text-surface-400 group-hover:text-ai-500 transition-colors" />
                    {c.fileName}
                  </div>
                  <div className="text-[10px] font-mono bg-surface-100 px-1.5 py-0.5 rounded text-surface-500">
                    {c.similarity.toFixed(2)}
                  </div>
                </div>
                <div className="text-xs text-surface-500 mb-1">
                  {c.chunkDetail}
                </div>
                <div className="line-clamp-1 border-l-2 border-surface-200 pl-2 text-xs italic text-surface-600">
                  "{c.snippet}"
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {suggestions.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-surface-500">Next</h3>
          <div className="flex flex-col gap-2">
            {suggestions.map((s, i) => (
              <button 
                key={i} 
                type="button"
                onClick={() => {
                  if (s === 'Open cited source' && citations[0]) {
                    const source = citations[0]
                    openTab(createDocumentTab({
                      documentId: source.documentId,
                      fileName: source.fileName,
                      snippet: source.snippet,
                      documentChunkId: source.documentChunkId,
                      chunkIndex: source.chunkIndex,
                      pageNumber: source.pageNumber,
                    }))
                    return
                  }

                  if (s === 'Ask a follow-up in the same workspace chat') {
                    setMode('Ask')
                    setPrompt('')
                    window.setTimeout(() => document.getElementById('ai-prompt')?.focus(), 0)
                  }
                }}
                className="group flex w-full items-center justify-between rounded-lg border border-border bg-surface-0 p-2.5 text-left text-sm text-surface-700 transition-all hover:bg-surface-100"
              >
                <span>{s}</span>
                <ChevronRight className="w-4 h-4 text-surface-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
