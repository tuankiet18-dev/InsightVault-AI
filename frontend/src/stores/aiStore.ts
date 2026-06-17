import { create } from 'zustand'
import type { AiMode } from '../lib/constants'

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
  mode: AiMode
  prompt: string
  scope: 'workspace' | 'folder' | 'document'
  answer: string | null
  citations: Citation[]
  suggestions: string[]
  isLoading: boolean

  setMode: (mode: AiMode) => void
  setPrompt: (prompt: string) => void
  setScope: (scope: 'workspace' | 'folder' | 'document') => void
  setAnswer: (answer: string | null) => void
  setCitations: (citations: Citation[]) => void
  setSuggestions: (suggestions: string[]) => void
  setIsLoading: (isLoading: boolean) => void
}

export const useAiStore = create<AiState>((set) => ({
  mode: 'Ask',
  prompt: '',
  scope: 'document',
  answer: null,
  citations: [],
  suggestions: [],
  isLoading: false,

  setMode: (mode) => set({ mode }),
  setPrompt: (prompt) => set({ prompt }),
  setScope: (scope) => set({ scope }),
  setAnswer: (answer) => set({ answer }),
  setCitations: (citations) => set({ citations }),
  setSuggestions: (suggestions) => set({ suggestions }),
  setIsLoading: (isLoading) => set({ isLoading }),
}))
