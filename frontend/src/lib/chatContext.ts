import type { ChatMessageContextRequest } from '@/types/api'

export function buildChatContexts(
  mentionedDocumentIds?: string[],
): ChatMessageContextRequest[] | undefined {
  if (mentionedDocumentIds && mentionedDocumentIds.length > 0) {
    return mentionedDocumentIds.map(id => ({
      contextType: 'document',
      documentId: id,
    }))
  }

  return undefined
}
