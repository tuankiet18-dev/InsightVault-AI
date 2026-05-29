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