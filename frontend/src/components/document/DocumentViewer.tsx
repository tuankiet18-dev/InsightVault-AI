import { useState } from 'react'
import { DocumentHeader } from './DocumentHeader'
import { DocumentChunksViewer } from './DocumentChunksViewer'
import { DocumentExtractedTextViewer } from './DocumentExtractedTextViewer'
import { DocumentOriginalViewer } from './DocumentOriginalViewer'
import { DocumentSummary } from './DocumentSummary'
import { useTabStore } from '@/stores/tabStore'
import { useDocument } from '@/hooks/useDocuments'
import { cn } from '@/lib/utils'
import type { DocumentDto } from '@/types/api'

type DocumentViewMode = 'original' | 'extracted' | 'chunks' | 'summary'

export function DocumentViewer() {
  const { getActiveTab } = useTabStore()
  
  const activeTab = getActiveTab()
  const documentId = (activeTab?.type === 'document' ? activeTab.documentId : null) || null
  const { data: document } = useDocument(documentId)
  
  if (!activeTab || activeTab.type !== 'document') {
    return null // Only render if active tab is a document
  }
  
  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center text-surface-500">
        Document not found or has been deleted.
      </div>
    )
  }

  const viewerKey = activeTab.type === 'document'
    ? `${document.id}-${activeTab.preferredView ?? 'default'}-${activeTab.sourceChunkId ?? activeTab.sourceChunkIndex ?? 'none'}`
    : document.id

  return <DocumentViewerContent key={viewerKey} document={document} />
}

function DocumentViewerContent({ document }: { document: DocumentDto }) {
  const { getActiveTab } = useTabStore()
  const activeTab = getActiveTab()
  const [viewMode, setViewMode] = useState<DocumentViewMode>(
    activeTab?.type === 'document' && activeTab.preferredView
      ? activeTab.preferredView
      : canPreviewOriginal(document.originalFileName, document.fileType)
      ? 'original'
      : canShowExtractedText(document.originalFileName, document.fileType)
        ? 'extracted'
        : 'summary'
  )

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      <DocumentHeader document={document} />

      <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-border bg-surface-0 px-4">
        <div className="inline-flex rounded-md bg-muted p-1">
          <ViewModeButton active={viewMode === 'original'} onClick={() => setViewMode('original')}>
            Original
          </ViewModeButton>
          <ViewModeButton active={viewMode === 'extracted'} onClick={() => setViewMode('extracted')}>
            Extracted Text
          </ViewModeButton>
          <ViewModeButton active={viewMode === 'chunks'} onClick={() => setViewMode('chunks')}>
            Chunks
          </ViewModeButton>
          <ViewModeButton active={viewMode === 'summary'} onClick={() => setViewMode('summary')}>
            AI Summary
          </ViewModeButton>
        </div>
        <span className="hidden rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground md:inline-flex">
          {viewMode === 'chunks' ? 'Index view' : viewMode === 'extracted' ? 'Processed text' : viewMode === 'summary' ? 'AI output' : 'Source file'}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-6xl items-start gap-12 px-5 py-5 lg:px-8 lg:py-8">
          <div className="min-w-0 flex-1">
            {viewMode === 'original' ? (
              <DocumentOriginalViewer
                document={document}
                sourceSnippet={activeTab?.type === 'document' ? activeTab.sourceSnippet : undefined}
                sourcePageNumber={activeTab?.type === 'document' ? activeTab.sourcePageNumber : undefined}
              />
            ) : viewMode === 'extracted' ? (
              <DocumentExtractedTextViewer document={document} />
            ) : viewMode === 'chunks' ? (
              <DocumentChunksViewer
                document={document}
                sourceChunkId={activeTab?.type === 'document' ? activeTab.sourceChunkId : undefined}
                sourceChunkIndex={activeTab?.type === 'document' ? activeTab.sourceChunkIndex : undefined}
              />
            ) : (
              <DocumentSummary document={document} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ViewModeButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'h-8 rounded px-3 text-xs font-semibold transition-colors',
        active ? 'bg-surface-0 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
      )}
      aria-pressed={active}
    >
      {children}
    </button>
  )
}

function canPreviewOriginal(fileName: string, fileType: string) {
  const normalized = `${fileName}.${fileType}`.toLowerCase()
  return normalized.endsWith('.pdf')
    || normalized.endsWith('.txt')
    || normalized.endsWith('.md')
    || normalized.endsWith('.markdown')
}

function canShowExtractedText(fileName: string, fileType: string) {
  const normalized = `${fileName}.${fileType}`.toLowerCase()
  return normalized.endsWith('.docx')
    || normalized.endsWith('.doc')
    || normalized.endsWith('.pdf')
    || normalized.endsWith('.txt')
    || normalized.endsWith('.md')
    || normalized.endsWith('.markdown')
}
