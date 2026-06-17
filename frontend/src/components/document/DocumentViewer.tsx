import { useState } from 'react'
import { DocumentHeader } from './DocumentHeader'
import { DocumentOriginalViewer } from './DocumentOriginalViewer'
import { DocumentSummary } from './DocumentSummary'
import { useTabStore } from '@/stores/tabStore'
import { useDocument } from '@/hooks/useDocuments'
import { cn } from '@/lib/utils'
import type { DocumentDto } from '@/types/api'

type DocumentViewMode = 'original' | 'summary'

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

  return <DocumentViewerContent key={document.id} document={document} />
}

function DocumentViewerContent({ document }: { document: DocumentDto }) {
  const [viewMode, setViewMode] = useState<DocumentViewMode>(
    canPreviewOriginal(document.originalFileName, document.fileType) ? 'original' : 'summary'
  )

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      <DocumentHeader document={document} viewMode={viewMode} setViewMode={setViewMode} />

      <div className={cn("flex-1 flex flex-col min-h-0", viewMode === 'original' ? "overflow-hidden" : "overflow-y-auto")}>
        <div className={cn(
          "mx-auto flex w-full flex-1 flex-col min-h-0",
          viewMode === 'summary' ? "max-w-[1280px] gap-12 p-6 lg:p-10" : ""
        )}>
          <div className="min-w-0 flex-1 flex flex-col min-h-0">
            {viewMode === 'original' ? (
              <DocumentOriginalViewer document={document} />
            ) : (
              <DocumentSummary document={document} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function canPreviewOriginal(fileName: string, fileType: string) {
  const normalized = `${fileName}.${fileType}`.toLowerCase()
  return normalized.endsWith('.pdf')
    || normalized.endsWith('.txt')
    || normalized.endsWith('.md')
    || normalized.endsWith('.markdown')
}
