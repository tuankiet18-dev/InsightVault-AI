import type { FolderItem } from '../types/document'

export const mockFolders: FolderItem[] = [
  {
    id: '1',
    name: 'Research Papers',
    documents: [
      {
        id: '1',
        fileName: 'RAG evaluation.pdf',
        type: 'PDF',
        status: 'completed',
      },
    ],
  },
]

export const mockDocuments = [
  {
    id: '1',
    fileName: 'RAG evaluation.pdf',
    type: 'PDF',
    status: 'completed',
    summary: 'Research document about RAG evaluation.',
  },
  {
    id: '2',
    fileName: 'Meeting notes.docx',
    type: 'DOCX',
    status: 'processing',
    summary: 'Weekly sprint meeting notes.',
  },
]