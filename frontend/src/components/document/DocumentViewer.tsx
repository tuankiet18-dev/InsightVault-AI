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

export type DocumentViewMode = 'original' | 'extracted' | 'chunks' | 'summary'

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

  return (
    <DocumentViewerContent 
      key={viewerKey} 
      document={document} 
      preferredView={activeTab.type === 'document' ? activeTab.preferredView : undefined}
      sourceSnippet={activeTab.type === 'document' ? activeTab.sourceSnippet : undefined}
      sourceChunkId={activeTab.type === 'document' ? activeTab.sourceChunkId : undefined}
      sourceChunkIndex={activeTab.type === 'document' ? activeTab.sourceChunkIndex : undefined}
      sourcePageNumber={activeTab.type === 'document' ? activeTab.sourcePageNumber : undefined}
    />
  )
}

function DocumentViewerContent({ 
  document,
  preferredView,
  sourceSnippet,
  sourceChunkId,
  sourceChunkIndex,
  sourcePageNumber,
  minimal
}: { 
  document: DocumentDto
  preferredView?: DocumentViewMode
  sourceSnippet?: string
  sourceChunkId?: string | null
  sourceChunkIndex?: number | null
  sourcePageNumber?: number | null
  minimal?: boolean
}) {
  const [viewMode, setViewMode] = useState<DocumentViewMode>(
    preferredView
      ? preferredView
      : canPreviewOriginal(document.originalFileName, document.fileType)
      ? 'original'
      : canShowExtractedText(document.originalFileName, document.fileType)
        ? 'extracted'
        : 'summary'
  )

  return (
    <div className={cn("flex flex-col flex-1 min-h-0", minimal ? "bg-surface-0" : "bg-background")}>
      {!minimal && <DocumentHeader document={document} viewMode={viewMode as 'original' | 'summary'} setViewMode={setViewMode as React.Dispatch<React.SetStateAction<DocumentViewMode>>} />}

      <div className={cn("flex-1 flex flex-col min-h-0", viewMode === 'original' ? "overflow-hidden" : "overflow-y-auto")}>
        <div className={cn(
          "mx-auto flex w-full flex-1 flex-col min-h-0",
          viewMode === 'summary' ? "max-w-[1280px] gap-12 p-6 lg:p-10" : ""
        )}>
          <div className="min-w-0 flex-1 flex flex-col min-h-0">
            {viewMode === 'original' ? (
              <DocumentOriginalViewer
                document={document}
                sourceSnippet={sourceSnippet}
                sourcePageNumber={sourcePageNumber}
              />
            ) : viewMode === 'extracted' ? (
              <DocumentExtractedTextViewer document={document} />
            ) : viewMode === 'chunks' ? (
              <DocumentChunksViewer
                document={document}
                sourceChunkId={sourceChunkId}
                sourceChunkIndex={sourceChunkIndex}
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

export { DocumentViewerContent }
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
