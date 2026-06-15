import { AiModeSelector } from './AiModeSelector'
import { PromptInput } from './PromptInput'
import { AiAnswer } from './AiAnswer'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useDocument } from '@/hooks/useDocuments'
import { useTabStore } from '@/stores/tabStore'
import { FileText, GitCompare, Sparkles } from 'lucide-react'

export function AiInspector() {
  const { selectedDocumentId, activeWorkspaceId } = useWorkspaceStore()
  const { getActiveTab } = useTabStore()
  const activeTab = getActiveTab()
  const activeDocumentId = activeTab?.type === 'document' ? activeTab.documentId : selectedDocumentId
  const { data: doc } = useDocument(activeDocumentId)

  if (!activeWorkspaceId) return null

  const scopeLabel = doc?.originalFileName
    ?? (activeTab?.type === 'report' ? activeTab.label : 'Workspace')
  const scopeType = doc ? 'Document' : activeTab?.type === 'report' ? 'Report' : 'Workspace'

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <header className="shrink-0 border-b border-border px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-ai-500" />
            AI Inspector
          </h2>
          <span className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {scopeType}
          </span>
        </div>
        <div className="mt-2 flex min-w-0 items-center gap-2 rounded-md bg-muted/70 px-2 py-1.5">
          {activeTab?.type === 'compare' ? (
            <GitCompare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-xs font-medium text-foreground">{scopeLabel}</span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <AiModeSelector />
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <div className="rounded-md border border-border bg-surface-50 px-3 py-3 text-sm leading-6 text-foreground">
            <div className="text-xs font-semibold text-muted-foreground">Current scope</div>
            <p className="mt-1">
              Ask is reserved for Chat/RAG. Compare and Report actions create backend AI jobs and persist results as reports.
            </p>
          </div>
          <AiAnswer />
        </div>
        <PromptInput />
      </div>
    </div>
  )
}
