import { FileBarChart2, FileText, Hash, Loader2, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useWorkspaceSearch } from '@/hooks/useSearch'
import { useUiStore } from '@/stores/uiStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useTabStore } from '@/stores/tabStore'
import { cn } from '@/lib/utils'
import { createDocumentTab } from '@/lib/documentTabs'
import type { WorkspaceSearchResultDto } from '@/types/api'

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUiStore()
  const { activeWorkspaceId } = useWorkspaceStore()
  const { openTab } = useTabStore()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)
  const { data: results = [], isFetching } = useWorkspaceSearch(activeWorkspaceId, query)

  useEffect(() => {
    if (!commandPaletteOpen) return

    const id = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [commandPaletteOpen])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setCommandPaletteOpen(true)
      }

      if (event.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setCommandPaletteOpen])

  if (!commandPaletteOpen) return null

  const openResult = (result: WorkspaceSearchResultDto) => {
    if (result.type === 'report' && result.reportId) {
      openTab({
        id: `report-${result.reportId}`,
        label: result.title,
        type: 'report',
        reportId: result.reportId,
        closable: true,
      })
    }

    if ((result.type === 'document' || result.type === 'chunk') && result.documentId) {
      openTab(createDocumentTab({
        documentId: result.documentId,
        fileName: result.title,
        snippet: result.snippet,
        documentChunkId: result.documentChunkId,
        chunkIndex: result.chunkIndex,
      }))
    }

    setCommandPaletteOpen(false)
    setQuery('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-surface-900/45 px-4 pt-[12vh] backdrop-blur-sm">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface-0 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search workspace..."
            className="h-9 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {isFetching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <button
            type="button"
            onClick={() => setCommandPaletteOpen(false)}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {query.trim().length < 2 ? (
            <EmptySearchMessage title="Start typing" detail="Documents, chunks, reports." />
          ) : results.length === 0 && !isFetching ? (
            <EmptySearchMessage title="No results" detail="Try another keyword." />
          ) : (
            <div className="space-y-1">
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.documentId ?? result.reportId ?? result.documentChunkId}-${index}`}
                  type="button"
                  onClick={() => openResult(result)}
                  className="flex w-full gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                >
                  <ResultIcon type={result.type} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">{result.title}</span>
                      <span className={cn(
                        'rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase',
                        result.type === 'chunk' ? 'bg-ai-50 text-ai-700' : 'bg-muted text-muted-foreground',
                      )}>
                        {result.type}
                      </span>
                    </div>
                    {result.snippet && (
                      <p className="mt-1 line-clamp-1 text-xs leading-5 text-surface-600">{result.snippet}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultIcon({ type }: { type: WorkspaceSearchResultDto['type'] }) {
  const className = "mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"

  if (type === 'report') return <FileBarChart2 className={className} />
  if (type === 'chunk') return <Hash className={className} />
  return <FileText className={className} />
}

function EmptySearchMessage({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center text-center">
      <Search className="mb-3 h-6 w-6 text-muted-foreground" />
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  )
}
