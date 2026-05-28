import { create } from 'zustand'
import type { AiMode } from '../lib/constants'

type AiState = {
  mode: AiMode
  prompt: string
  scope: 'workspace' | 'folder' | 'document'

  setMode: (mode: AiMode) => void
  setPrompt: (prompt: string) => void
  setScope: (scope: 'workspace' | 'folder' | 'document') => void
}

export const useAiStore = create<AiState>((set) => ({
  mode: 'Ask',
  prompt: '',
  scope: 'document',

  setMode: (mode) => set({ mode }),
  setPrompt: (prompt) => set({ prompt }),
  setScope: (scope) => set({ scope }),
}))
