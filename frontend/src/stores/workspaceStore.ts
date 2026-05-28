import { create } from 'zustand'
import type { WorkspaceDto, FolderDto, DocumentDto, WorkspaceMemberDto, AiJobDto } from '@/types/api-contract'
import { mockWorkspaces, mockFolders, mockMembers } from '@/data/mockWorkspaces'
import { mockDocuments, mockJobs } from '@/data/mockDocuments'

type WorkspaceState = {
  workspaces: WorkspaceDto[]
  activeWorkspaceId: string | null
  folders: FolderDto[]
  documents: DocumentDto[]
  members: WorkspaceMemberDto[]
  jobs: AiJobDto[]
  selectedFolderId: string | null
  selectedDocumentId: string | null

  setActiveWorkspace: (id: string) => void
  setSelectedFolder: (id: string | null) => void
  setSelectedDocument: (id: string | null) => void
  getActiveWorkspace: () => WorkspaceDto | undefined
  getSelectedDocument: () => DocumentDto | undefined
  getFolderDocuments: (folderId: string) => DocumentDto[]
  getProcessingJobs: () => AiJobDto[]
  getFailedJobs: () => AiJobDto[]
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: mockWorkspaces,
  activeWorkspaceId: 'ws-001',
  folders: mockFolders,
  documents: mockDocuments,
  members: mockMembers,
  jobs: mockJobs,
  selectedFolderId: null,
  selectedDocumentId: 'doc-001',

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id, selectedFolderId: null, selectedDocumentId: null }),
  setSelectedFolder: (id) => set({ selectedFolderId: id }),
  setSelectedDocument: (id) => set({ selectedDocumentId: id }),

  getActiveWorkspace: () => {
    const { workspaces, activeWorkspaceId } = get()
    return workspaces.find(w => w.id === activeWorkspaceId)
  },

  getSelectedDocument: () => {
    const { documents, selectedDocumentId } = get()
    return documents.find(d => d.id === selectedDocumentId)
  },

  getFolderDocuments: (folderId) => {
    const { documents } = get()
    return documents.filter(d => d.folderId === folderId)
  },

  getProcessingJobs: () => {
    const { jobs } = get()
    return jobs.filter(j => j.status === 'processing')
  },

  getFailedJobs: () => {
    const { jobs } = get()
    return jobs.filter(j => j.status === 'failed')
  },
}))
