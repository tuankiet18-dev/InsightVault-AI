import { useEffect, useRef, useState } from 'react'
import { AlertCircle, Braces, Hash, Loader2 } from 'lucide-react'
import { useDocumentChunks } from '@/hooks/useDocuments'
import { cn } from '@/lib/utils'
import type { DocumentDto } from '@/types/api'

export function DocumentChunksViewer({
  document,
  sourceChunkId,
  sourceChunkIndex,
}: {
  document: DocumentDto
  sourceChunkId?: string | null
  sourceChunkIndex?: number | null
}) {
  const { data: chunks = [], isLoading, isError } = useDocumentChunks(document.id)
  const targetRef = useRef<HTMLElement | null>(null)

  const [expandedChunks, setExpandedChunks] = useState<Record<string, boolean>>({})

  const toggleChunk = (id: string) => {
    setExpandedChunks(prev => ({ ...prev, [id]: !prev[id] }))
  }

  useEffect(() => {
    targetRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [sourceChunkId, sourceChunkIndex, chunks.length])

  if (isLoading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-border bg-surface-0 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading chunks...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-0 p-8 text-center">
        <AlertCircle className="mb-3 h-6 w-6 text-danger-600" />
        <h2 className="text-sm font-semibold text-foreground">Chunks could not be loaded</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          Try again after the backend is ready.
        </p>
      </div>
    )
  }

  if (chunks.length === 0) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-0 p-8 text-center">
        <Braces className="mb-3 h-6 w-6 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">No chunks indexed yet</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
          Wait for processing to complete.
        </p>
      </div>
    )
  }

  return (
    <section className="space-y-2">
      <div className="rounded-lg border border-border bg-surface-0 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-foreground">{chunks.length} chunks</span>
          <span className="rounded-full bg-success-50 px-2 py-0.5 font-medium text-success-700">Searchable</span>
          <span className="text-muted-foreground">{chunks[0]?.embeddingModel || 'embedding model unknown'}</span>
        </div>
      </div>

      {chunks.map((chunk) => {
        const isTarget = (!!sourceChunkId && chunk.id === sourceChunkId)
          || (sourceChunkIndex != null && chunk.chunkIndex === sourceChunkIndex)

        const isExpanded = !!expandedChunks[chunk.id]

        return (
        <article
          key={chunk.id}
          ref={isTarget ? targetRef : undefined}
          onClick={() => toggleChunk(chunk.id)}
          className={cn(
            "rounded-lg border bg-surface-0 p-3 transition-colors cursor-pointer hover:bg-accent/30",
            isTarget ? "border-ai-400 bg-ai-50 ring-2 ring-ai-100" : "border-border",
          )}
        >
          <header className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Hash className="h-4 w-4 text-ai-500" />
              Chunk {chunk.chunkIndex}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
              {chunk.tokenCount != null && <span>{chunk.tokenCount} tokens</span>}
              {chunk.charStart != null && chunk.charEnd != null && (
                <span>chars {chunk.charStart}-{chunk.charEnd}</span>
              )}
            </div>
          </header>
          <p className={cn("whitespace-pre-wrap text-sm leading-6 text-surface-700 transition-all", !isExpanded && "line-clamp-4")}>{chunk.content}</p>
        </article>
        )
      })}
    </section>
  )
}
