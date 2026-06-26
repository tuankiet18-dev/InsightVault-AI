import { create } from 'zustand'

type PendingChatTurn = {
  workspaceId: string
  sessionId?: string | null
  userContent: string
}

type ChatState = {
  activeSessionId: string | null
  inputValue: string
  pendingTurn: PendingChatTurn | null
  activeRequestController: AbortController | null

  setActiveSession: (id: string | null) => void
  setInputValue: (value: string) => void
  setPendingTurn: (turn: PendingChatTurn | null) => void
  setActiveRequestController: (controller: AbortController | null) => void
  abortActiveRequest: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  activeSessionId: null,
  inputValue: '',
  pendingTurn: null,
  activeRequestController: null,

  setActiveSession: (id) => set({ activeSessionId: id }),
  setInputValue: (value) => set({ inputValue: value }),
  setPendingTurn: (turn) => set({ pendingTurn: turn }),
  setActiveRequestController: (controller) => set({ activeRequestController: controller }),
  abortActiveRequest: () => {
    const controller = useChatStore.getState().activeRequestController
    controller?.abort()
    set({ activeRequestController: null })
  },
}))
