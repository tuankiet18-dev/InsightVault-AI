import { create } from 'zustand'
import type { TabItem } from '@/types/ui'

type TabState = {
  tabs: TabItem[]
  activeTabId: string | null
  openTab: (tab: TabItem) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  getActiveTab: () => TabItem | undefined
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [
    { id: 'tab-doc-001', label: 'Project Proposal v3.pdf', type: 'document', documentId: 'doc-001', closable: true },
  ],
  activeTabId: 'tab-doc-001',

  openTab: (tab) => {
    const { tabs } = get()
    const existing = tabs.find(t => t.id === tab.id)
    if (existing) {
      set({ activeTabId: tab.id })
    } else {
      set({ tabs: [...tabs, tab], activeTabId: tab.id })
    }
  },

  closeTab: (id) => {
    const { tabs, activeTabId } = get()
    const filtered = tabs.filter(t => t.id !== id)
    if (activeTabId === id) {
      const idx = tabs.findIndex(t => t.id === id)
      const nextTab = filtered[Math.min(idx, filtered.length - 1)]
      set({ tabs: filtered, activeTabId: nextTab?.id ?? null })
    } else {
      set({ tabs: filtered })
    }
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find(t => t.id === activeTabId)
  },
}))
