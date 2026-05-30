import { AiModeSelector } from './AiModeSelector'
import { PromptInput } from './PromptInput'
import { AiAnswer } from './AiAnswer'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useDocument } from '@/hooks/useDocuments'

export function AiInspector() {
  const { selectedDocumentId, activeWorkspaceId } = useWorkspaceStore()
  const { data: doc } = useDocument(selectedDocumentId)

  if (!activeWorkspaceId) return null

  return (
    <div className="flex flex-col h-full min-h-0 bg-surface-50">
      <header className="px-4 py-3 border-b border-border bg-surface-0 flex items-center justify-between shrink-0">
        <h2 className="font-semibold text-surface-900">AI Inspector</h2>
        <span className="text-[11px] font-medium bg-surface-100 text-surface-600 px-2 py-0.5 rounded border border-border truncate max-w-[150px]">
          Scope: {doc ? doc.originalFileName : 'Workspace'}
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        <AiModeSelector />
        <PromptInput />
        <AiAnswer />
      </div>
    </div>
  )
}
