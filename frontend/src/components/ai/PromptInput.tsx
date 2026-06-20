import { useAiStore } from '@/stores/aiStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useChatStore } from '@/stores/chatStore'
import { useTabStore } from '@/stores/tabStore'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { chatApi } from '@/api/chatApi'
import { chatKeys, useChatSessions } from '@/hooks/useChat'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/http'
import { buildChatContexts } from '@/lib/chatContext'
import { toast } from 'sonner'
import type { ChatMessageDto, ChatSessionDto, ChatSourceDto } from '@/types/api'

export function PromptInput() {
  const { prompt, setPrompt, setAnswer, setCitations, setSuggestions, isLoading, setIsLoading } = useAiStore()
  const { activeWorkspaceId, selectedDocumentId, selectedFolderId } = useWorkspaceStore()
  const { activeSessionId, setActiveSession } = useChatStore()
  const { getActiveTab } = useTabStore()
  const activeTab = getActiveTab()
  const queryClient = useQueryClient()
  const { data: sessions = [] } = useChatSessions(activeWorkspaceId)
  
  const placeholder = 'Ask about the selected document, folder, or workspace...'
  
  const handleRun = async () => {
    if (!prompt.trim() || isLoading || !activeWorkspaceId) return
    
    setIsLoading(true)
    setAnswer(null)
    setCitations([])
    setSuggestions([])

    const currentPrompt = prompt
    const optimisticMessageId = `temp-${Date.now()}`
    let targetSessionId: string | null = null
    setPrompt('')

    try {
      const activeDocumentId = selectedDocumentId
        ?? (!selectedFolderId && activeTab?.type === 'document' ? activeTab.documentId : null)
      const sessionTitle = activeDocumentId
        ? `doc-${activeDocumentId}`
        : selectedFolderId
          ? `folder-${selectedFolderId}`
          : 'Workspace chat'

      let session = sessions.find((candidate) => candidate.title === sessionTitle)

      if (!session) {
        session = await chatApi.createSession(activeWorkspaceId, { title: sessionTitle })
      }

      targetSessionId = session.id
      queryClient.setQueryData<ChatSessionDto[]>(chatKeys.sessions(activeWorkspaceId), (oldSessions = []) => [
        session,
        ...oldSessions.filter((candidate) => candidate.id !== session.id),
      ])

      if (session.id !== activeSessionId) {
        setActiveSession(session.id)
      }

      const optimisticMessage: ChatMessageDto = {
        id: optimisticMessageId,
        chatSessionId: session.id,
        role: 'user',
        content: currentPrompt,
        contexts: [],
        sources: [],
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData<ChatMessageDto[]>(chatKeys.messages(session.id), (oldMessages = []) => [
        ...oldMessages,
        optimisticMessage,
      ])

      const response = await chatApi.sendMessage(session.id, {
        content: currentPrompt,
        contexts: buildChatContexts(activeTab, selectedDocumentId, selectedFolderId),
      })

      queryClient.setQueryData<ChatMessageDto[]>(chatKeys.messages(session.id), (oldMessages = []) => [
        ...oldMessages.filter((message) =>
          message.id !== optimisticMessageId
          && message.id !== response.userMessage.id
          && message.id !== response.assistantMessage.id
        ),
        response.userMessage,
        response.assistantMessage,
      ])

      queryClient.invalidateQueries({ queryKey: chatKeys.sessions(activeWorkspaceId) })
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(session.id) })

      setAnswer(response.assistantMessage.content)
      setCitations(response.assistantMessage.sources
        .filter(hasDocumentSource)
        .map(source => ({
          documentId: source.documentId,
          documentChunkId: source.documentChunkId,
          fileName: source.fileName,
          similarity: source.similarity ?? 0,
          chunkDetail: source.pageNumber
            ? `Page ${source.pageNumber}${source.chunkIndex != null ? ` - chunk ${source.chunkIndex}` : ''}`
            : source.chunkIndex != null
              ? `Chunk ${source.chunkIndex}`
              : source.documentChunkId
                ? `Chunk ${source.documentChunkId.slice(0, 8)}`
                : 'Retrieved source',
          snippet: source.snippet,
          chunkIndex: source.chunkIndex,
          pageNumber: source.pageNumber,
        })))
      setSuggestions(
        response.assistantMessage.sources.length > 0
          ? ['Open cited source', 'Ask a follow-up in the same workspace chat']
          : ['Try asking about a completed document', 'Open a report or document to narrow the scope']
      )
    } catch (error) {
      const errorMessage = formatChatError(error)
      setAnswer(errorMessage)
      setPrompt(currentPrompt)
      setSuggestions(['Check that at least one source document is completed', 'Try again after the AI service is ready'])
      toast.error(errorMessage)

      if (targetSessionId) {
        const localErrorMessage: ChatMessageDto = {
          id: `error-${Date.now()}`,
          chatSessionId: targetSessionId,
          role: 'assistant',
          content: errorMessage,
          contexts: [],
          sources: [],
          createdAt: new Date().toISOString(),
        }

        queryClient.setQueryData<ChatMessageDto[]>(chatKeys.messages(targetSessionId), (oldMessages = []) => [
          ...oldMessages,
          localErrorMessage,
        ])
        queryClient.invalidateQueries({ queryKey: chatKeys.sessions(activeWorkspaceId) })
      }
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (prompt.trim()) {
        handleRun()
      }
    }
  }

  return (
    <div className="border-t border-border p-2">
      <div className="relative">
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-h-[60px] w-full resize-none rounded-lg border border-border bg-card p-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-ai/40"
        />
        <button
          onClick={handleRun}
          disabled={isLoading || !prompt.trim()}
          className={cn(
            "absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all",
            isLoading || !prompt.trim()
              ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  )
}

function hasDocumentSource(source: ChatSourceDto): source is ChatSourceDto & { documentId: string } {
  return !!source.documentId
}

function formatChatError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.errorCode === 'chat.no_completed_documents') {
      return 'No completed documents were found in the selected chat scope. Upload or wait for processing to finish, then ask again.'
    }

    if (error.errorCode === 'chat.ai_failed') {
      return 'The AI service could not answer this question right now. The message was saved, so you can retry in the same workspace chat.'
    }

    return error.message
  }

  return 'Chat failed unexpectedly. Please try again.'
}
