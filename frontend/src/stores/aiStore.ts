import { create } from 'zustand'
import type { AiMode } from '@/lib/constants'
import type { Citation } from '@/types/ui'

type AiState = {
  mode: AiMode
  prompt: string
  isLoading: boolean
  answer: string | null
  citations: Citation[]
  suggestions: string[]
  scope: 'workspace' | 'folder' | 'document'

  setMode: (mode: AiMode) => void
  setPrompt: (prompt: string) => void
  setScope: (scope: 'workspace' | 'folder' | 'document') => void
  runAnalysis: () => void
  clearAnswer: () => void
}

export const useAiStore = create<AiState>((set) => ({
  mode: 'Ask',
  prompt: '',
  isLoading: false,
  answer: null,
  citations: [],
  suggestions: [],
  scope: 'document',

  setMode: (mode) => set({ mode, answer: null, citations: [], suggestions: [] }),
  setPrompt: (prompt) => set({ prompt }),
  setScope: (scope) => set({ scope }),

  runAnalysis: () => {
    set({ isLoading: true })
    // Simulate AI response delay
    setTimeout(() => {
      set({
        isLoading: false,
        answer: 'MVP includes auth, shared workspace, RBAC collaboration, folder/document upload, background processing, summary, RAG Q&A, comparison, gap detection, Markdown reports, and admin job monitoring.',
        citations: [
          {
            documentId: 'doc-001',
            fileName: 'Requirement.docx',
            chunkDetail: 'chunk 09',
            similarity: 0.86,
            snippet: 'MVP bao gồm: Google OAuth login, shared workspace + member roles, folder management...',
          },
          {
            documentId: 'doc-002',
            fileName: 'Proposal v2.md',
            chunkDetail: 'section 21',
            similarity: 0.81,
            snippet: 'InsightVault AI giúp nhóm không chỉ lưu tài liệu, mà còn hiểu và khai thác tri thức...',
          },
          {
            documentId: 'doc-003',
            fileName: 'Sprint demo script.md',
            chunkDetail: 'heading 4',
            similarity: 0.74,
            snippet: 'Demo flow: login → workspace → invite → upload → process → summary → RAG chat...',
          },
        ],
        suggestions: [
          'Compare with Proposal v2.md',
          'Generate gap analysis report',
          'Create sprint demo script',
        ],
      })
    }, 1500)
  },

  clearAnswer: () => set({ answer: null, citations: [], suggestions: [] }),
}))
