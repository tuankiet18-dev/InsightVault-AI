import { AiModeSelector } from './AiModeSelector'
import { PromptInput } from './PromptInput'
import { AiAnswer } from './AiAnswer'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useFolder } from '@/hooks/useFolders'
import { useDocument } from '@/hooks/useDocuments'
import { useTabStore } from '@/stores/tabStore'
import { useAiStore } from '@/stores/aiStore'
import { useChatStore } from '@/stores/chatStore'
import { useChatMessages, useChatSessions } from '@/hooks/useChat'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { FileText, GitCompare, Sparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'

export function AiInspector() {
  const { selectedDocumentId, selectedFolderId, activeWorkspaceId } = useWorkspaceStore()
  const { mode } = useAiStore()
  const { getActiveTab } = useTabStore()
  const activeTab = getActiveTab()
  const activeDocumentId = selectedDocumentId
    ?? (!selectedFolderId && activeTab?.type === 'document' ? activeTab.documentId : null)
  const { data: doc } = useDocument(activeDocumentId)
  const { data: folder } = useFolder(selectedFolderId)

  if (!activeWorkspaceId) return null

  const scopeLabel = doc?.originalFileName
    ?? folder?.name
    ?? (!selectedDocumentId && !selectedFolderId && activeTab?.type === 'report' ? activeTab.label : 'Workspace')
  const scopeType = doc
    ? 'Document'
    : folder
      ? 'Folder'
      : !selectedDocumentId && !selectedFolderId && activeTab?.type === 'report'
        ? 'Report'
        : 'Workspace'

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
        <ModeHint />
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          {mode === 'Ask' ? <InspectorChatTranscript workspaceId={activeWorkspaceId} /> : <AiAnswer />}
        </div>
        <PromptInput />
      </div>
    </div>
  )
}

function ModeHint() {
  const { mode } = useAiStore()
  const message = mode === 'Ask'
    ? 'Ask answers from the current scope.'
    : mode === 'Compare'
      ? 'Compare needs 2+ documents or a folder.'
      : 'Report creates a saved AI report.'

  return (
    <div className="mx-2 mb-2 rounded-md bg-muted/70 px-2.5 py-1.5 text-xs text-muted-foreground">
      {message}
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
