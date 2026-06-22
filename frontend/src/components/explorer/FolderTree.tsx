import { ChevronRight, ChevronDown, Folder, File, FileText, Image as ImageIcon, UploadCloud, FolderPlus } from 'lucide-react'
import { useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useTabStore } from '@/stores/tabStore'
import { useUiStore } from '@/stores/uiStore'
import { useFolders, useUpdateFolder } from '@/hooks/useFolders'
import { useDocuments, useUpdateDocument } from '@/hooks/useDocuments'
import { useWorkspace } from '@/hooks/useWorkspaces'
import { getFileTypeColor, cn } from '@/lib/utils'
import { hasPermission } from '@/utils/permission'
import { useAuthStore } from '@/stores/authStore'
import type { DocumentDto, FolderDto } from '@/types/api'

export function FolderTree() {
  const { activeWorkspaceId } = useWorkspaceStore()
  const { data: folders = [] } = useFolders(activeWorkspaceId)
  const { data: activeWorkspace } = useWorkspace(activeWorkspaceId)
  const canEdit = hasPermission(activeWorkspace?.currentUserRole, 'upload_document')
  const updateFolder = useUpdateFolder()
  const updateDocument = useUpdateDocument(activeWorkspaceId!)
  const [isDragOver, setIsDragOver] = useState(false)

  if (!activeWorkspaceId) return null

  const handleDragOver = (e: React.DragEvent) => {
    if (!canEdit) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    if (!canEdit) return
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (!canEdit) return
    e.preventDefault()
    setIsDragOver(false)
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type === 'document' && data.folderId !== null) {
        updateDocument.mutate({ documentId: data.id, data: { folderId: null, hasFolderId: true } })
      } else if (data.type === 'folder' && data.parentId !== null) {
        updateFolder.mutate({ folderId: data.id, data: { parentFolderId: null, hasParentFolderId: true } })
      }
    } catch {
      // Ignore
    }
  }
  
  return (
    <section
      className={cn("rounded-md transition-colors", isDragOver && "bg-surface-100 ring-2 ring-primary ring-inset")}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col border-l border-border pl-3 mt-1">
        {folders.map(folder => (
          <FolderRow
            key={folder.id}
            folder={folder}
            workspaceId={activeWorkspaceId}
            canEdit={canEdit}
          />
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
import { createDocumentTab } from '@/lib/documentTabs'

function FolderRow({
  folder,
  workspaceId,
  canEdit,
}: {
  folder: FolderDto
  workspaceId: string
  canEdit: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const { selectedFolderId, setSelectedFolder } = useWorkspaceStore()
  const { openUploadModal, openCreateFolderModal } = useUiStore()
  const { data: documents = [] } = useDocuments(workspaceId, { folderId: folder.id })
  const { data: childFolders = [] } = useFolders(workspaceId, folder.id)
  const deleteMutation = useDeleteFolder(workspaceId)
  const updateFolder = useUpdateFolder()
  const updateDocument = useUpdateDocument(workspaceId)
  const { user } = useAuthStore()
  const { data: activeWorkspace } = useWorkspace(workspaceId)
  
  const isSelected = selectedFolderId === folder.id
  const role = activeWorkspace?.currentUserRole
  const canDeleteFolder = 
    role === 'owner' || 
    (role === 'editor' && (folder.createdById === user?.id || (documents.length === 0 && childFolders.length === 0)))

  const handleDelete = () => {
    deleteMutation.mutate(folder.id, {
      onSuccess: () => setIsDeleteModalOpen(false)
    })
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation()
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'folder', id: folder.id, name: folder.name, parentId: folder.parentFolderId }))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (!canEdit) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    if (!canEdit) return
    e.stopPropagation()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    if (!canEdit) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    
    try {
      const data = JSON.parse(e.dataTransfer.getData('application/json'))
      if (data.type === 'document' && data.folderId !== folder.id) {
        updateDocument.mutate({ documentId: data.id, data: { folderId: folder.id, hasFolderId: true } })
      } else if (data.type === 'folder' && data.id !== folder.id && data.parentId !== folder.id) {
        updateFolder.mutate({ folderId: data.id, data: { parentFolderId: folder.id, hasParentFolderId: true } })
      }
    } catch {
      // Ignore
    }
  }

  return (
    <div className="flex flex-col">
      <div
        draggable={canEdit}
        onDragStart={canEdit ? handleDragStart : undefined}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-sm text-left transition-colors group relative select-none",
          canEdit && "cursor-grab active:cursor-grabbing",
          isSelected ? "bg-surface-200 text-surface-900" : "text-surface-700 hover:bg-surface-100",
          isDragOver && "bg-surface-200 ring-2 ring-primary ring-inset"
        )}
      >
        <button
          onClick={() => {
            setExpanded(!expanded)
            setSelectedFolder(folder.id)
          }}
          className="flex-1 flex items-center gap-1.5 min-w-0"
        >
          {expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-surface-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-surface-400 shrink-0" />
          )}
          <Folder className="w-4 h-4 text-surface-400 shrink-0" fill="currentColor" fillOpacity={0.2} />
          <span className="truncate font-medium">{folder.name}</span>
          <span className="ml-auto text-[10px] text-muted-foreground">{documents.length}</span>
        </button>
        {canEdit && (
          <div className="flex items-center rounded bg-surface-100/80 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 group-has-[data-state=open]:opacity-100">
            <button
              onClick={(e) => {
                e.stopPropagation()
                openUploadModal(folder.id)
              }}
              className="rounded p-1 text-surface-500 transition-colors hover:bg-surface-300"
              title="Upload to folder"
            >
              <UploadCloud className="h-3.5 w-3.5" />
            </button>
            <DropdownMenu align="right">
              <DropdownMenuItem onClick={() => {}} icon={<Edit2 className="h-4 w-4" />}>
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => openCreateFolderModal(folder.id)} 
                icon={<FolderPlus className="h-4 w-4" />}
              >
                New Subfolder
              </DropdownMenuItem>
              {canDeleteFolder && (
                <DropdownMenuItem
                  destructive
                  onClick={() => setIsDeleteModalOpen(true)}
                  icon={<Trash2 className="h-4 w-4" />}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenu>
          </div>
        )}
      </div>
      
      {expanded && (
        <div className="flex flex-col pl-4 border-l border-border/40 ml-2 mt-0.5">
          {documents.length === 0 && childFolders.length === 0 ? (
            <div className="px-2 py-1 text-xs text-muted-foreground italic">Empty</div>
          ) : (
            <>
              {childFolders.map(child => (
                <FolderRow key={child.id} folder={child} workspaceId={workspaceId} canEdit={canEdit} />
              ))}
              {documents.map(doc => (
                <DocumentRow key={doc.id} document={doc} workspaceId={workspaceId} canEdit={canEdit} />
              ))}
            </>
          )}
        </div>
      )}

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title={`Delete Folder "${folder.name}"?`}
        description="This action cannot be undone. All documents inside this folder will also be deleted or orphaned depending on your settings."
        confirmText="Delete Folder"
      />
    </div>
  )
}

function DocumentRow({
  document,
  workspaceId,
  canEdit,
}: {
  document: DocumentDto
  workspaceId: string
  canEdit: boolean
}) {
  const { selectedDocumentId, setSelectedDocument } = useWorkspaceStore()
  const { openTab, closeTab } = useTabStore()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const deleteMutation = useDeleteDocument(workspaceId)
  const { user } = useAuthStore()
  const { data: activeWorkspace } = useWorkspace(workspaceId)
  
  const isSelected = selectedDocumentId === document.id
  const role = activeWorkspace?.currentUserRole
  const canDeleteDocument = 
    role === 'owner' || 
    (role === 'editor' && document.uploadedById === user?.id)
  
  const handleOpen = () => {
    setSelectedDocument(document.id)
    openTab(createDocumentTab({
      documentId: document.id,
      fileName: document.originalFileName,
    }))
  }

  const handleDelete = () => {
    deleteMutation.mutate(document.id, {
      onSuccess: () => {
        setIsDeleteModalOpen(false)
        closeTab(`tab-${document.id}`)
        closeTab(`doc-${document.id}`)
      }
    })
  }

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation()
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'document', id: document.id, name: document.originalFileName, folderId: document.folderId }))
    e.dataTransfer.effectAllowed = 'move'
  }

  return (
    <>
      <div
        draggable={canEdit}
        onDragStart={canEdit ? handleDragStart : undefined}
        className={cn(
          "flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm text-left transition-colors group relative select-none",
          canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
          isSelected ? "bg-surface-100 text-surface-900" : "text-surface-600 hover:bg-surface-100"
        )}
        onClick={handleOpen}
      >
        <div className="flex items-center gap-1.5 overflow-hidden pr-2">
          <FileIcon type={document.fileType} />
          <span className="truncate">{document.originalFileName}</span>
        </div>
        
        <div className="flex items-center gap-1 shrink-0">
          <MiniStatus status={document.status} />
          {canEdit && (
            <div className="flex items-center rounded bg-surface-100/80 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 group-has-[data-state=open]:opacity-100">
              <DropdownMenu align="right">
                <DropdownMenuItem onClick={() => {}} icon={<Edit2 className="h-4 w-4" />}>
                  Rename
                </DropdownMenuItem>
                {canDeleteDocument && (
                  <DropdownMenuItem
                    destructive
                    onClick={() => setIsDeleteModalOpen(true)}
                    icon={<Trash2 className="h-4 w-4" />}
                  >
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenu>
            </div>
          )}
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

function MiniStatus({ status }: { status: string }) {
  const label = status === 'completed' ? 'Ready' : status.replace('_', ' ')
  const classes =
    status === 'completed'
      ? 'bg-success-50 text-success-600'
      : status === 'processing'
        ? 'bg-warning-50 text-warning-700'
        : status === 'failed'
          ? 'bg-danger-50 text-danger-700'
          : 'bg-surface-100 text-surface-600'

  return (
    <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase', classes)}>
      {label}
    </span>
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
