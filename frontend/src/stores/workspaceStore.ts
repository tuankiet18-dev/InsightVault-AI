import { create } from 'zustand'

type WorkspaceState = {
  activeWorkspaceId: string | null
  selectedFolderId: string | null
  selectedDocumentId: string | null

  setActiveWorkspace: (id: string | null) => void
  setSelectedFolder: (id: string | null) => void
  setSelectedDocument: (id: string | null) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  activeWorkspaceId: null,
  selectedFolderId: null,
  selectedDocumentId: null,

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id, selectedFolderId: null, selectedDocumentId: null }),
  setSelectedFolder: (id) => set({ selectedFolderId: id }),
  setSelectedDocument: (id) => set({ selectedDocumentId: id }),
}))
