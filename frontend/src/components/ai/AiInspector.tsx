import { PromptInput } from './PromptInput'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useFolder } from '@/hooks/useFolders'
import { useDocument } from '@/hooks/useDocuments'
import { useTabStore } from '@/stores/tabStore'
import { useAiStore } from '@/stores/aiStore'
import { useChatStore } from '@/stores/chatStore'
import { useChatMessages, useChatSessions, useCreateChatSession } from '@/hooks/useChat'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { FileText, GitCompare, Sparkles, Plus } from 'lucide-react'
import { useEffect, useRef } from 'react'

export function AiInspector() {
  const { selectedDocumentId, selectedFolderId, activeWorkspaceId } = useWorkspaceStore()
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
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <InspectorChatTranscript 
            workspaceId={activeWorkspaceId} 
            sessionTitle={activeDocumentId ? `doc-${activeDocumentId}` : selectedFolderId ? `folder-${selectedFolderId}` : 'Workspace chat'}
            scopeLabel={scopeLabel}
          />
        </div>
        <PromptInput />
      </div>
    </div>
  )
}


function InspectorChatTranscript({ workspaceId, sessionTitle, scopeLabel }: { workspaceId: string, sessionTitle: string, scopeLabel: string }) {
  const { activeSessionId, setActiveSession } = useChatStore()
  const { isLoading } = useAiStore()
  const { data: sessions = [] } = useChatSessions(workspaceId)
  
  const currentScopeSession = sessions.find(session => session.title === sessionTitle)
  const sessionId = currentScopeSession?.id ?? null
  
  const { data: messages = [] } = useChatMessages(sessionId)
  const createSession = useCreateChatSession(workspaceId)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const handleNewChat = () => {
    createSession.mutate(
      { title: sessionTitle },
      {
        onSuccess: (newSession) => {
          setActiveSession(newSession.id)
        }
      }
    )
  }

  useEffect(() => {
    if (sessionId && sessionId !== activeSessionId) {
      setActiveSession(sessionId)
    }
  }, [activeSessionId, sessionId, setActiveSession])

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, isLoading])

  if (!sessionId || messages.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center text-center text-surface-500">
        <Sparkles className="h-8 w-8 text-surface-300 mb-3" />
        <p className="text-sm">No chat history for this {sessionTitle.startsWith('doc') ? 'document' : sessionTitle.startsWith('folder') ? 'folder' : 'workspace'}.</p>
        <p className="text-xs mt-1">Send a message below to start chatting.</p>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground truncate pr-2">
          Chat: {scopeLabel}
        </div>
        <button
          onClick={handleNewChat}
          disabled={createSession.isPending}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-50 shrink-0"
          title="Clear chat history"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Clear</span>
        </button>
      </div>
      <div className="space-y-3">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="w-full flex justify-start">
            <div className="w-full max-w-3xl border border-border bg-slate-50/50 dark:bg-slate-900/50 flex gap-3 rounded-xl p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                  AI is thinking...
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>
    </div>
  )
}
