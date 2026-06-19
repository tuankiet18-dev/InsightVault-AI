import { create } from 'zustand'
import type { TabItem } from '@/types/ui'

type TabState = {
  tabs: TabItem[]
  activeTabId: string | null
  openTab: (tab: TabItem) => void
  closeTab: (id: string) => void
  setActiveTab: (id: string) => void
  resetTabs: () => void
  getActiveTab: () => TabItem | undefined
}

export const useTabStore = create<TabState>((set, get) => ({
  tabs: [],
  activeTabId: null,

  openTab: (tab) => {
    const { tabs } = get()
    const existing = tabs.find(t => t.id === tab.id)
    if (existing) {
      set({
        tabs: tabs.map(item => item.id === tab.id ? { ...item, ...tab } : item),
        activeTabId: tab.id,
      })
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

  resetTabs: () => set({ tabs: [], activeTabId: null }),

  getActiveTab: () => {
    const { tabs, activeTabId } = get()
    return tabs.find(t => t.id === activeTabId)
  },
}))
