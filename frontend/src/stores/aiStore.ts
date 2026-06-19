import { create } from 'zustand'

export type Citation = {
  documentId: string
  documentChunkId?: string | null
  fileName: string
  similarity: number
  chunkDetail: string
  snippet: string
  chunkIndex?: number | null
  pageNumber?: number | null
}

type AiState = {
  prompt: string
  scope: 'workspace' | 'folder' | 'document'
  answer: string | null
  citations: Citation[]
  suggestions: string[]
  isLoading: boolean

  setPrompt: (prompt: string) => void
  setScope: (scope: 'workspace' | 'folder' | 'document') => void
  setAnswer: (answer: string | null) => void
  setCitations: (citations: Citation[]) => void
  setSuggestions: (suggestions: string[]) => void
  setIsLoading: (isLoading: boolean) => void
}

export const useAiStore = create<AiState>((set) => ({
  prompt: '',
  scope: 'document',
  answer: null,
  citations: [],
  suggestions: [],
  isLoading: false,

  setPrompt: (prompt) => set({ prompt }),
  setScope: (scope) => set({ scope }),
  setAnswer: (answer) => set({ answer }),
  setCitations: (citations) => set({ citations }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setIsLoading: (isLoading) => set({ isLoading }),
}))
