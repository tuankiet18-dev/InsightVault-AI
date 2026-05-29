import { ChevronRight, ChevronDown, Folder, File, FileText, Image as ImageIcon, Plus, UploadCloud } from 'lucide-react'
import { useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useTabStore } from '@/stores/tabStore'
import { useUiStore } from '@/stores/uiStore'
import { useFolders } from '@/hooks/useFolders'
import { useDocuments } from '@/hooks/useDocuments'
import { getFileTypeColor, getStatusColor, cn } from '@/lib/utils'
import type { DocumentDto } from '@/types/api'

export function FolderTree() {
  const { activeWorkspaceId } = useWorkspaceStore()
  const { data: folders = [] } = useFolders(activeWorkspaceId)
  const { setCreateFolderModalOpen } = useUiStore()
  
  if (!activeWorkspaceId) return null
  
  return (
    <section className="px-3 py-4 border-t border-border">
      <div className="mb-2 px-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-surface-500 uppercase tracking-wider">
          Documents
        </span>
        <div className="flex items-center gap-0.5">
         
          <button
            onClick={() => setCreateFolderModalOpen(true)}
            className="p-1.5 rounded hover:bg-surface-200 text-surface-500 transition-colors"
            title="New folder"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex flex-col">
        {folders.map(folder => (
          <FolderRow key={folder.id} folderId={folder.id} name={folder.name} workspaceId={activeWorkspaceId} />
        ))}
      </div>
    </section>
  )
}

import { Edit2, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuItem } from '../ui/DropdownMenu'
import { ConfirmModal } from '../ui/ConfirmModal'
import { useDeleteFolder } from '@/hooks/useFolders'
import { useDeleteDocument } from '@/hooks/useDocuments'

function FolderRow({ folderId, name, workspaceId }: { folderId: string; name: string; workspaceId: string }) {
  const [expanded, setExpanded] = useState(true)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const { selectedFolderId, setSelectedFolder } = useWorkspaceStore()
  const { openUploadModal } = useUiStore()
  const { data: documents = [] } = useDocuments(workspaceId, { folderId })
  const deleteMutation = useDeleteFolder(workspaceId)
  
  const isSelected = selectedFolderId === folderId

  const handleDelete = () => {
    deleteMutation.mutate(folderId, {
      onSuccess: () => setIsDeleteModalOpen(false)
    })
  }

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-sm text-left transition-colors group relative",
          isSelected ? "bg-surface-200 text-surface-900" : "text-surface-700 hover:bg-surface-100"
        )}
      >
        <button
          onClick={() => {
            setExpanded(!expanded)
            setSelectedFolder(folderId)
          }}
          className="flex-1 flex items-center gap-1.5 min-w-0"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-surface-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-surface-400 shrink-0" />
          )}
          <Folder className="w-4 h-4 text-surface-400 shrink-0" fill="currentColor" fillOpacity={0.2} />
          <span className="truncate font-medium">{name}</span>
        </button>
        <div className="opacity-0 group-hover:opacity-100 flex items-center bg-surface-100/80 backdrop-blur-sm rounded transition-all">
          <button
            onClick={(e) => {
              e.stopPropagation()
              openUploadModal(folderId)
            }}
            className="p-1 hover:bg-surface-300 rounded text-surface-500 transition-colors"
            title="Upload to folder"
          >
            <UploadCloud className="w-3.5 h-3.5" />
          </button>
          <DropdownMenu align="right">
            <DropdownMenuItem onClick={() => {}} icon={<Edit2 className="w-4 h-4" />}>
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem 
              destructive 
              onClick={() => setIsDeleteModalOpen(true)}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenu>
        </div>
      </div>
      
      {expanded && (
        <div className="flex flex-col pl-6">
          {documents.length === 0 ? (
            <div className="px-2 py-1 text-xs text-surface-400 italic">Empty</div>
          ) : (
            documents.map(doc => <DocumentRow key={doc.id} document={doc} workspaceId={workspaceId} />)
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title={`Delete Folder "${name}"?`}
        description="This action cannot be undone. All documents inside this folder will also be deleted or orphaned depending on your settings."
        confirmText="Delete Folder"
      />
    </div>
  )
}

function DocumentRow({ document, workspaceId }: { document: DocumentDto, workspaceId: string }) {
  const { selectedDocumentId, setSelectedDocument } = useWorkspaceStore()
  const { openTab } = useTabStore()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const deleteMutation = useDeleteDocument(workspaceId)
  
  const isSelected = selectedDocumentId === document.id
  const statusColor = getStatusColor(document.status)
  
  const handleOpen = () => {
    setSelectedDocument(document.id)
    openTab({
      id: `tab-${document.id}`,
      label: document.originalFileName,
      type: 'document',
      documentId: document.id,
      closable: true
    })
  }

  const handleDelete = () => {
    deleteMutation.mutate(document.id, {
      onSuccess: () => setIsDeleteModalOpen(false)
    })
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm text-left transition-colors group relative cursor-pointer",
          isSelected ? "bg-surface-100 text-surface-900" : "text-surface-600 hover:bg-surface-100"
        )}
        onClick={handleOpen}
      >
        <div className="flex items-center gap-1.5 overflow-hidden pr-2">
          <FileIcon type={document.fileType} />
          <span className="truncate">{document.originalFileName}</span>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          {document.status !== 'completed' && (
            <div 
              className={cn("w-1.5 h-1.5 rounded-full", statusColor.dot)} 
              title={`Status: ${document.status}`}
            />
          )}
          <div className="opacity-0 group-hover:opacity-100 flex items-center bg-surface-100/80 backdrop-blur-sm rounded transition-all">
            <DropdownMenu align="right">
              <DropdownMenuItem onClick={() => {}} icon={<Edit2 className="w-4 h-4" />}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                destructive 
                onClick={() => setIsDeleteModalOpen(true)}
                icon={<Trash2 className="w-4 h-4" />}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title={`Delete Document?`}
        description={`Are you sure you want to delete "${document.originalFileName}"? This action cannot be undone.`}
        confirmText="Delete Document"
      />
    </>
  )
}

function FileIcon({ type }: { type: string }) {
  const color = getFileTypeColor(type)
  const normalized = type.toLowerCase()
  
  if (normalized === 'pdf') {
    return <FileText className={cn("w-4 h-4 shrink-0", color)} />
  }
  if (normalized === 'docx' || normalized === 'doc') {
    return <File className={cn("w-4 h-4 shrink-0", color)} />
  }
  if (normalized === 'png' || normalized === 'jpg' || normalized === 'jpeg') {
    return <ImageIcon className={cn("w-4 h-4 shrink-0", color)} />
  }
  
  return <FileText className={cn("w-4 h-4 shrink-0", color)} />
}
