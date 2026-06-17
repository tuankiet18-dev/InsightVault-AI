import { AiModeSelector } from './AiModeSelector'
import { PromptInput } from './PromptInput'
import { AiAnswer } from './AiAnswer'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useDocument } from '@/hooks/useDocuments'
import { useTabStore } from '@/stores/tabStore'
import { useAiStore } from '@/stores/aiStore'
import { useChatStore } from '@/stores/chatStore'
import { useChatMessages, useChatSessions } from '@/hooks/useChat'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { FileText, GitCompare, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'

export function AiInspector() {
  const { selectedDocumentId, activeWorkspaceId } = useWorkspaceStore()
  const { mode } = useAiStore()
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
              Ask uses the active workspace context. Open a document or report to narrow retrieval before asking.
            </p>
          </div>
          {mode === 'Ask' ? <InspectorChatTranscript workspaceId={activeWorkspaceId} /> : <AiAnswer />}
        </div>
        <PromptInput />
      </div>
    </div>
  )
}

function InspectorChatTranscript({ workspaceId }: { workspaceId: string }) {
  const { activeSessionId, setActiveSession } = useChatStore()
  const { isLoading } = useAiStore()
  const { data: sessions = [] } = useChatSessions(workspaceId)
  const latestSession = sessions[0]
  const sessionId = sessions.some(session => session.id === activeSessionId)
    ? activeSessionId
    : latestSession?.id ?? null
  const { data: messages = [] } = useChatMessages(sessionId)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (sessionId && sessionId !== activeSessionId) {
      setActiveSession(sessionId)
    }
  }, [activeSessionId, sessionId, setActiveSession])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, isLoading])

  if (!sessionId || messages.length === 0) {
    return null
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Workspace chat history
      </div>
      <div className="space-y-3">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="rounded-md border border-border bg-surface-0 px-3 py-2 text-xs text-muted-foreground">
            AI is reading the selected context...
          </div>
        )}
        <div ref={scrollRef} />
      </div>
    </div>
  )
}
