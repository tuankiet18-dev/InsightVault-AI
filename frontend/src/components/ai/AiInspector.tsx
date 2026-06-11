import { AiModeSelector } from './AiModeSelector'
import { PromptInput } from './PromptInput'
import { AiAnswer } from './AiAnswer'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useDocument } from '@/hooks/useDocuments'
import { Sparkles } from 'lucide-react'

export function AiInspector() {
  const { selectedDocumentId, activeWorkspaceId } = useWorkspaceStore()
  const { data: doc } = useDocument(selectedDocumentId)

  if (!activeWorkspaceId) return null

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <header className="flex h-10 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <h2 className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-ai-500" />
          AI Inspector
        </h2>
        <span className="max-w-[150px] truncate rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
          {doc ? doc.originalFileName : 'Workspace'}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <AiModeSelector />
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="rounded-md border border-border bg-surface-50 px-3 py-3 text-sm leading-6 text-foreground">
            Xin chao. Toi co the tom tat, hoi dap, so sanh tai lieu trong workspace.
            Hay thu hoi: <em>MVP gom nhung chuc nang nao?</em>
          </div>
          <AiAnswer />
        </div>
        <PromptInput />
      </div>
    </div>
  )
}
