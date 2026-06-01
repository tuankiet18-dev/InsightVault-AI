import { DocumentHeader } from './DocumentHeader'
import { DocumentSummary } from './DocumentSummary'
import { useTabStore } from '@/stores/tabStore'
import { useDocument } from '@/hooks/useDocuments'

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

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      <DocumentHeader document={document} />
      
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-5xl items-start gap-12 px-8 py-8">
          <div className="min-w-0 flex-1">
            <DocumentSummary document={document} />
          </div>
        </div>
      </div>
    </div>
  )
}
