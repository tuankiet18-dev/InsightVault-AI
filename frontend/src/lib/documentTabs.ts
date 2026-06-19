import type { DocumentTabItem } from '@/types/ui'

type DocumentSourceTabInput = {
  documentId: string
  fileName: string
  snippet?: string | null
  documentChunkId?: string | null
  chunkIndex?: number | null
  pageNumber?: number | null
}

export function createDocumentTab(input: DocumentSourceTabInput): DocumentTabItem {
  return {
    id: `doc-${input.documentId}`,
    label: input.fileName,
    type: 'document',
    documentId: input.documentId,
    preferredView: input.documentChunkId || input.chunkIndex != null ? 'chunks' : undefined,
    sourceSnippet: input.snippet ?? undefined,
    sourceChunkId: input.documentChunkId,
    sourceChunkIndex: input.chunkIndex,
    sourcePageNumber: input.pageNumber,
    closable: true,
  }
}
