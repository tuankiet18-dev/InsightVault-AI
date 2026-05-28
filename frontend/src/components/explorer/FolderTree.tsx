import { ChevronRight, ChevronDown, Folder, File, FileText, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useTabStore } from '@/stores/tabStore'
import { getFileTypeColor, getStatusColor, cn } from '@/lib/utils'
import type { DocumentDto } from '@/types/api-contract'

export function FolderTree() {
  const { activeWorkspaceId, folders } = useWorkspaceStore()
  
  if (!activeWorkspaceId) return null
  
  return (
    <section className="px-3 py-4 border-t border-border">
      <div className="mb-2 px-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">
        Documents
      </div>
      <div className="flex flex-col">
        {folders.map(folder => (
          <FolderRow key={folder.id} folderId={folder.id} name={folder.name} />
        ))}
      </div>
    </section>
  )
}

function FolderRow({ folderId, name }: { folderId: string; name: string }) {
  const [expanded, setExpanded] = useState(true)
  const { getFolderDocuments, selectedFolderId, setSelectedFolder } = useWorkspaceStore()
  const documents = getFolderDocuments(folderId)
  
  const isSelected = selectedFolderId === folderId

  return (
    <div className="flex flex-col">
      <button
        onClick={() => {
          setExpanded(!expanded)
          setSelectedFolder(folderId)
        }}
        className={cn(
          "flex items-center gap-1.5 w-full px-2 py-1.5 rounded-md text-sm text-left transition-colors",
          isSelected ? "bg-surface-200 text-surface-900" : "text-surface-700 hover:bg-surface-100"
        )}
      >
        {expanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-surface-400 shrink-0" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-surface-400 shrink-0" />
        )}
        <Folder className="w-4 h-4 text-surface-400 shrink-0" fill="currentColor" fillOpacity={0.2} />
        <span className="truncate font-medium">{name}</span>
      </button>
      
      {expanded && (
        <div className="flex flex-col pl-6">
          {documents.length === 0 ? (
            <div className="px-2 py-1 text-xs text-surface-400 italic">Empty</div>
          ) : (
            documents.map(doc => <DocumentRow key={doc.id} document={doc} />)
          )}
        </div>
      )}
    </div>
  )
}

function DocumentRow({ document }: { document: DocumentDto }) {
  const { selectedDocumentId, setSelectedDocument } = useWorkspaceStore()
  const { openTab } = useTabStore()
  
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

  return (
    <button
      onClick={handleOpen}
      className={cn(
        "flex items-center justify-between w-full px-2 py-1.5 rounded-md text-sm text-left transition-colors group",
        isSelected ? "bg-surface-100 text-surface-900" : "text-surface-600 hover:bg-surface-100"
      )}
    >
      <div className="flex items-center gap-1.5 overflow-hidden">
        <FileIcon type={document.fileType} />
        <span className="truncate">{document.originalFileName}</span>
      </div>
      
      {document.status !== 'completed' && (
        <div 
          className={cn("w-1.5 h-1.5 rounded-full shrink-0 ml-2", statusColor.dot)} 
          title={`Status: ${document.status}`}
        />
      )}
    </button>
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
