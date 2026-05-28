import { create } from 'zustand'

type ChatState = {
  activeSessionId: string | null
  inputValue: string

  setActiveSession: (id: string | null) => void
  setInputValue: (value: string) => void
}

export const useChatStore = create<ChatState>((set) => ({
  activeSessionId: null,
  inputValue: '',

  setActiveSession: (id) => set({ activeSessionId: id }),
  setInputValue: (value) => set({ inputValue: value }),
}))
