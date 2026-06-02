import { create } from 'zustand';
import type { WorkspaceRole } from '../types/api';

interface EditorState {
  activeWorkspaceId: string | null;
  setActiveWorkspaceId: (id: string | null) => void;
  
  openTabs: string[];
  activeTabId: string | null;
  openDocument: (id: string) => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string | null) => void;

  role: WorkspaceRole;
  setRole: (role: WorkspaceRole) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  activeWorkspaceId: null,
  setActiveWorkspaceId: (id) => set({ activeWorkspaceId: id }),

  openTabs: [],
  activeTabId: null,
  openDocument: (id) => set((state) => ({
    openTabs: state.openTabs.includes(id) ? state.openTabs : [...state.openTabs, id],
    activeTabId: id,
  })),
  closeTab: (id) => set((state) => {
    const nextTabs = state.openTabs.filter((t) => t !== id);
    return {
      openTabs: nextTabs,
      activeTabId: state.activeTabId === id ? (nextTabs[nextTabs.length - 1] ?? null) : state.activeTabId,
    };
  }),
  setActiveTab: (id) => set({ activeTabId: id }),

  role: 'editor' as WorkspaceRole,
  setRole: (role) => set({ role }),
}));
