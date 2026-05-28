import { create } from 'zustand'
import type { ChatSessionDto, ChatMessageDto } from '@/types/api-contract'
import { mockChatSessions, mockChatMessages } from '@/data/mockChat'

type ChatState = {
  sessions: ChatSessionDto[]
  activeSessionId: string | null
  messages: ChatMessageDto[]
  isLoading: boolean
  inputValue: string

  setActiveSession: (id: string | null) => void
  setInputValue: (value: string) => void
  sendMessage: (content: string) => void
  getActiveMessages: () => ChatMessageDto[]
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: mockChatSessions,
  activeSessionId: 'chat-001',
  messages: mockChatMessages,
  isLoading: false,
  inputValue: '',

  setActiveSession: (id) => set({ activeSessionId: id }),
  setInputValue: (value) => set({ inputValue: value }),

  sendMessage: (content) => {
    const { activeSessionId, messages } = get()
    if (!activeSessionId) return

    const userMsg: ChatMessageDto = {
      id: `msg-${Date.now()}`,
      chatSessionId: activeSessionId,
      role: 'user',
      content,
      modelName: null,
      sources: [],
      createdAt: new Date().toISOString(),
    }

    set({ messages: [...messages, userMsg], isLoading: true, inputValue: '' })

    setTimeout(() => {
      const assistantMsg: ChatMessageDto = {
        id: `msg-${Date.now() + 1}`,
        chatSessionId: activeSessionId,
        role: 'assistant',
        content: 'Based on the documents in your workspace, I can provide the following analysis. The documents cover the core MVP features including authentication, workspace collaboration, document management, AI processing pipeline, RAG chat, document comparison, and report generation.',
        modelName: 'gemini-1.5-pro',
        sources: [
          {
            documentId: 'doc-001',
            documentChunkId: 'chunk-012',
            fileName: 'Requirement.docx',
            snippet: 'MVP includes auth, workspace, folder, document management...',
            similarity: 0.88,
          },
        ],
        createdAt: new Date().toISOString(),
      }
      set((s) => ({ messages: [...s.messages, assistantMsg], isLoading: false }))
    }, 2000)
  },

  getActiveMessages: () => {
    const { messages, activeSessionId } = get()
    return messages.filter(m => m.chatSessionId === activeSessionId)
  },
}))
