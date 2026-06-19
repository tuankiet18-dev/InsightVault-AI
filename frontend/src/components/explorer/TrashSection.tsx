import { useState } from 'react'
import { ChevronRight, ChevronDown, Trash2, FileText, Image as ImageIcon, File, RotateCcw, XCircle } from 'lucide-react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useAuthStore } from '@/stores/authStore'
import { useWorkspace } from '@/hooks/useWorkspaces'
import { useTrashDocuments, useRestoreDocument, useHardDeleteDocument } from '@/hooks/useDocuments'
import { getFileTypeColor, cn } from '@/lib/utils'
import { DropdownMenu, DropdownMenuItem } from '../ui/DropdownMenu'
import { ConfirmModal } from '../ui/ConfirmModal'
import type { DocumentDto } from '@/types/api'

export function TrashSection() {
  const [expanded, setExpanded] = useState(false)
  const { activeWorkspaceId } = useWorkspaceStore()
  const { data: trashDocuments = [], isLoading } = useTrashDocuments(activeWorkspaceId)
  const { user } = useAuthStore()
  const { data: activeWorkspace } = useWorkspace(activeWorkspaceId)
  
  if (!activeWorkspaceId) return null

  // Hide trash entirely if there are no items to avoid cluttering UI, or maybe show it if owner? 
  // Let's show it if there are items, or if we want to be consistent, always show it like a folder.
  // Actually, always showing "Trash" is standard.
  const role = activeWorkspace?.currentUserRole
  // Viewers shouldn't really manage trash, maybe we hide it for them if they can't do anything?
  // Let's keep it visible so they know items are deleted, but they won't have actions.

  return (
    <div className="mt-2 flex flex-col">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-1.5 rounded px-2 py-1.5 text-sm font-semibold text-surface-600 transition-colors hover:bg-surface-100 hover:text-surface-900"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        )}
        <Trash2 className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Trash</span>
        {trashDocuments.length > 0 && (
          <span className="rounded-full bg-surface-200 px-1.5 py-0.5 text-[10px] font-medium text-surface-600">
            {trashDocuments.length}
          </span>
        )}
      </button>

      {expanded && (
        <div className="flex flex-col border-l border-border pl-3 mt-1 ml-2">
          {isLoading ? (
            <div className="px-2 py-1 text-xs text-muted-foreground italic">Loading...</div>
          ) : trashDocuments.length === 0 ? (
            <div className="px-2 py-1 text-xs text-muted-foreground italic">Trash is empty</div>
          ) : (
            trashDocuments.map(doc => (
              <TrashRow 
                key={doc.id} 
                document={doc} 
                workspaceId={activeWorkspaceId} 
                role={role}
                currentUserId={user?.id}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function TrashRow({
  document,
  workspaceId,
  role,
  currentUserId
}: {
  document: DocumentDto
  workspaceId: string
  role?: string
  currentUserId?: string
}) {
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false)
  const [isHardDeleteModalOpen, setIsHardDeleteModalOpen] = useState(false)
  const restoreMutation = useRestoreDocument(workspaceId)
  const hardDeleteMutation = useHardDeleteDocument(workspaceId)

  const canManageTrashItem = 
    role === 'owner' || 
    (role === 'editor' && document.uploadedById === currentUserId)

  const handleRestore = () => {
    restoreMutation.mutate(document.id, {
      onSuccess: () => setIsRestoreModalOpen(false)
    })
  }

  const handleHardDelete = () => {
    hardDeleteMutation.mutate(document.id, {
      onSuccess: () => setIsHardDeleteModalOpen(false)
    })
  }

  return (
    <>
      <div className="flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm text-left transition-colors group relative hover:bg-surface-100 text-surface-500">
        <div className="flex items-center gap-1.5 overflow-hidden pr-2 opacity-70">
          <FileIcon type={document.fileType} />
          <span className="truncate line-through decoration-surface-400">{document.originalFileName}</span>
        </div>
        
        {canManageTrashItem && (
          <div className="flex items-center rounded bg-surface-100/80 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 shrink-0">
            <DropdownMenu align="right">
              <DropdownMenuItem 
                onClick={() => setIsRestoreModalOpen(true)} 
                icon={<RotateCcw className="h-4 w-4" />}
              >
                Restore
              </DropdownMenuItem>
              <DropdownMenuItem
                destructive
                onClick={() => setIsHardDeleteModalOpen(true)}
                icon={<XCircle className="h-4 w-4" />}
              >
                Delete Permanently
              </DropdownMenuItem>
            </DropdownMenu>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onConfirm={handleRestore}
        isLoading={restoreMutation.isPending}
        title={`Restore Document?`}
        description={`Are you sure you want to restore "${document.originalFileName}"?`}
        confirmText="Restore Document"
      />

      <ConfirmModal
        isOpen={isHardDeleteModalOpen}
        onClose={() => setIsHardDeleteModalOpen(false)}
        onConfirm={handleHardDelete}
        isLoading={hardDeleteMutation.isPending}
        title={`Permanently Delete Document?`}
        description={`Are you sure you want to permanently delete "${document.originalFileName}"? This action CANNOT be undone.`}
        confirmText="Delete Permanently"
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
