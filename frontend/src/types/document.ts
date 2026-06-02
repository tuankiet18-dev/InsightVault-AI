export type DocumentItem = {
  id: string
  fileName: string
  type: string
  status: 'completed' | 'processing' | 'failed'
}

export type FolderItem = {
  id: string
  name: string
  documents: DocumentItem[]
}