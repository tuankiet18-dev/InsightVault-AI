import type { AiMode } from '@/lib/constants'

export type NavItem = {
  id: string
  label: string
  path: string
  icon?: string
}

export type TabItem = {
  id: string
  label: string
  type: 'document' | 'compare' | 'report' | 'chat'
  documentId?: string
  closable?: boolean
}

export type FolderTreeNode = {
  id: string
  name: string
  description?: string
  expanded: boolean
  documents: DocumentTreeNode[]
}

export type DocumentTreeNode = {
  id: string
  fileName: string
  fileType: string
  status: string
  active?: boolean
}

export type AiInspectorState = {
  mode: AiMode
  prompt: string
  isLoading: boolean
  answer: string | null
  citations: Citation[]
  suggestions: string[]
}

export type Citation = {
  documentId: string
  fileName: string
  chunkDetail: string
  similarity: number
  snippet: string
}

export type CompareSection = {
  title: string
  items: string[]
  variant: 'neutral' | 'success' | 'danger' | 'warning' | 'info'
}

export type AdminMetric = {
  label: string
  value: number | string
  change?: string
  trend?: 'up' | 'down' | 'stable'
}

export type Theme = 'light' | 'dark' | 'system'
