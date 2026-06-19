import type { ChatMessageContextRequest } from '@/types/api'
import type { TabItem } from '@/types/ui'

export function buildChatContexts(
  activeTab: TabItem | undefined,
  selectedDocumentId: string | null,
  selectedFolderId: string | null,
): ChatMessageContextRequest[] | undefined {
  if (selectedDocumentId) {
    return [{ contextType: 'document', documentId: selectedDocumentId }]
  }

  if (selectedFolderId) {
    return [{ contextType: 'folder', folderId: selectedFolderId, includeSubfolders: true }]
  }

  if (activeTab?.type === 'report') {
    return [{ contextType: 'report', reportId: activeTab.reportId }]
  }

  if (activeTab?.type === 'document') {
    return [{ contextType: 'document', documentId: activeTab.documentId }]
  }

  return undefined
}
