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
      <header className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <h2 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-ai" />
          AI Inspector
        </h2>
        <span className="max-w-[170px] truncate rounded border border-border bg-background px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Scope: {doc ? doc.originalFileName : 'Workspace'}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <AiModeSelector />
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="rounded-lg bg-muted px-3 py-3 text-sm leading-6 text-foreground">
            Xin chào! Tôi có thể tóm tắt, hỏi đáp, so sánh tài liệu trong workspace.
            Hãy thử hỏi: <em>MVP gồm những chức năng nào?</em>
          </div>
          <AiAnswer />
        </div>
        <PromptInput />
      </div>
    </div>
  )
}
