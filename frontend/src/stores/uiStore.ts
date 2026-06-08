import { create } from 'zustand'

type UiState = {
  explorerOpen: boolean
  inspectorOpen: boolean
  uploadModalOpen: boolean
  uploadTargetFolderId: string | null
  createWorkspaceModalOpen: boolean
  createFolderModalOpen: boolean
  createFolderTargetParentId: string | null
  commandPaletteOpen: boolean
  inviteModalOpen: boolean
  activeNavItem: string
  mobileDrawer: 'explorer' | 'inspector' | null

  toggleExplorer: () => void
  toggleInspector: () => void
  setUploadModalOpen: (open: boolean) => void
  openUploadModal: (folderId?: string) => void
  setCreateWorkspaceModalOpen: (open: boolean) => void
  openCreateFolderModal: (parentId?: string) => void
  closeCreateFolderModal: () => void
  setCommandPaletteOpen: (open: boolean) => void
  setInviteModalOpen: (open: boolean) => void
  setActiveNavItem: (id: string) => void
  setMobileDrawer: (drawer: 'explorer' | 'inspector' | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  explorerOpen: true,
  inspectorOpen: true,
  uploadModalOpen: false,
  uploadTargetFolderId: null,
  createWorkspaceModalOpen: false,
  createFolderModalOpen: false,
  createFolderTargetParentId: null,
  commandPaletteOpen: false,
  inviteModalOpen: false,
  activeNavItem: 'explorer',
  mobileDrawer: null,

  toggleExplorer: () => set((s) => ({ explorerOpen: !s.explorerOpen })),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
  setUploadModalOpen: (open) => set({ uploadModalOpen: open, uploadTargetFolderId: open ? undefined : null }),
  openUploadModal: (folderId) => set({ uploadModalOpen: true, uploadTargetFolderId: folderId || null }),
  setCreateWorkspaceModalOpen: (open) => set({ createWorkspaceModalOpen: open }),
  openCreateFolderModal: (parentId) => set({ createFolderModalOpen: true, createFolderTargetParentId: parentId || null }),
  closeCreateFolderModal: () => set({ createFolderModalOpen: false, createFolderTargetParentId: null }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setInviteModalOpen: (open) => set({ inviteModalOpen: open }),
  setActiveNavItem: (id) => set({ activeNavItem: id }),
  setMobileDrawer: (drawer) => set({ mobileDrawer: drawer }),
}))
