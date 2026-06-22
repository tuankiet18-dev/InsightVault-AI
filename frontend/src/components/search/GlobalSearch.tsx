import { FileBarChart2, FileText, Hash, Loader2, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useWorkspaceSearch } from '@/hooks/useSearch'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useTabStore } from '@/stores/tabStore'
import { cn } from '@/lib/utils'
import { createDocumentTab } from '@/lib/documentTabs'
import type { WorkspaceSearchResultDto } from '@/types/api'
import { Popover, PopoverContent, PopoverAnchor } from '@/components/ui/popover'

export function GlobalSearch() {
  const { activeWorkspaceId } = useWorkspaceStore()
  const { openTab } = useTabStore()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const { data: results = [], isFetching } = useWorkspaceSearch(activeWorkspaceId, query)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

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

    setIsOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  const showDropdown = isOpen && query.trim().length > 0

  return (
    <Popover open={showDropdown} onOpenChange={setIsOpen}>
      <PopoverAnchor asChild>
        <div ref={containerRef} className="relative mx-2 hidden h-8 max-w-xl flex-1 items-center md:flex">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              if (event.target.value.trim().length > 0) {
                setIsOpen(true)
              } else {
                setIsOpen(false)
              }
            }}
            onFocus={() => {
              if (query.trim().length > 0) setIsOpen(true)
            }}
            placeholder="Search documents, chunks, reports..."
            className="h-full w-full rounded-md border border-border bg-background py-1.5 pl-9 pr-12 text-sm text-foreground shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary"
          />
          {isFetching && (
            <Loader2 className="absolute right-12 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
            Ctrl K
          </kbd>
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-0 shadow-lg"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
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
      </PopoverContent>
    </Popover>
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
