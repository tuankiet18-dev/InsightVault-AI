import { useWorkspaceStore } from '@/stores/workspaceStore'
import { DocumentHeader } from './DocumentHeader'
import { DocumentSummary } from './DocumentSummary'
import { DocumentOutline } from './DocumentOutline'
import { useTabStore } from '@/stores/tabStore'

export function DocumentViewer() {
  const { getActiveTab } = useTabStore()
  const { documents } = useWorkspaceStore()
  
  const activeTab = getActiveTab()
  
  if (!activeTab || activeTab.type !== 'document') {
    return null // Only render if active tab is a document
  }
  
  const document = documents.find(d => d.id === activeTab.documentId)
  
  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center text-surface-500">
        Document not found or has been deleted.
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-surface-50">
      <DocumentHeader document={document} />
      
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-start gap-12">
          <div className="flex-1 min-w-0 bg-surface-0 p-8 rounded-2xl shadow-sm border border-border">
            <DocumentSummary document={document} />
          </div>
          
          <DocumentOutline document={document} />
        </div>
      </div>
    </div>
  )
}
