import { create } from 'zustand'

type UiState = {
  explorerOpen: boolean
  inspectorOpen: boolean
  uploadModalOpen: boolean
  commandPaletteOpen: boolean
  inviteModalOpen: boolean
  activeNavItem: string
  mobileDrawer: 'explorer' | 'inspector' | null

  toggleExplorer: () => void
  toggleInspector: () => void
  setUploadModalOpen: (open: boolean) => void
  setCommandPaletteOpen: (open: boolean) => void
  setInviteModalOpen: (open: boolean) => void
  setActiveNavItem: (id: string) => void
  setMobileDrawer: (drawer: 'explorer' | 'inspector' | null) => void
}

export const useUiStore = create<UiState>((set) => ({
  explorerOpen: true,
  inspectorOpen: true,
  uploadModalOpen: false,
  commandPaletteOpen: false,
  inviteModalOpen: false,
  activeNavItem: 'explorer',
  mobileDrawer: null,

  toggleExplorer: () => set((s) => ({ explorerOpen: !s.explorerOpen })),
  toggleInspector: () => set((s) => ({ inspectorOpen: !s.inspectorOpen })),
  setUploadModalOpen: (open) => set({ uploadModalOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setInviteModalOpen: (open) => set({ inviteModalOpen: open }),
  setActiveNavItem: (id) => set({ activeNavItem: id }),
  setMobileDrawer: (drawer) => set({ mobileDrawer: drawer }),
}))
