import { useAiStore } from '@/stores/aiStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useChatStore } from '@/stores/chatStore'
import { useTabStore } from '@/stores/tabStore'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCompareDocuments, useGenerateReport } from '@/hooks/useReports'
import { chatApi } from '@/api/chatApi'
import { chatKeys, useChatSessions } from '@/hooks/useChat'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/http'
import type { ChatMessageContextRequest } from '@/types/api'
import type { TabItem } from '@/types/ui'

export function PromptInput() {
  const { prompt, setPrompt, mode, setAnswer, setCitations, setSuggestions, isLoading, setIsLoading } = useAiStore()
  const { activeWorkspaceId, selectedDocumentId, selectedFolderId } = useWorkspaceStore()
  const { activeSessionId, setActiveSession } = useChatStore()
  const { getActiveTab } = useTabStore()
  const activeTab = getActiveTab()
  const queryClient = useQueryClient()
  const { data: sessions = [] } = useChatSessions(activeWorkspaceId)
  
  const compareMutation = useCompareDocuments()
  const generateReportMutation = useGenerateReport(activeWorkspaceId || '')
  
  const handleRun = async () => {
    if (!prompt.trim() || isLoading || !activeWorkspaceId) return
    
    setIsLoading(true)
    setAnswer(null)
    setCitations([])
    setSuggestions([])

    const documentIds = selectedDocumentId ? [selectedDocumentId] : []
    const folderId = selectedFolderId

    if (mode === 'Ask') {
      try {
        const activeSession = sessions.find(session => session.id === activeSessionId)
        const session = activeSession ?? sessions[0] ?? await chatApi.createSession(activeWorkspaceId, {
          title: 'Workspace chat',
        })

        if (session.id !== activeSessionId) {
          setActiveSession(session.id)
        }

        const response = await chatApi.sendMessage(session.id, {
          content: prompt,
          contexts: buildAskContexts(activeTab, selectedDocumentId, selectedFolderId),
        })

        queryClient.invalidateQueries({ queryKey: chatKeys.sessions(activeWorkspaceId) })
        queryClient.invalidateQueries({ queryKey: chatKeys.messages(session.id) })

        setAnswer(response.assistantMessage.content)
        setCitations(response.assistantMessage.sources
          .filter(source => !!source.documentId)
          .map(source => ({
            documentId: source.documentId,
            documentChunkId: source.documentChunkId,
            fileName: source.fileName,
            similarity: source.similarity ?? 0,
            chunkDetail: source.pageNumber
              ? `Page ${source.pageNumber}${source.chunkIndex != null ? ` · chunk ${source.chunkIndex}` : ''}`
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
        setPrompt('')
      } catch (error) {
        setAnswer(formatChatError(error))
        setSuggestions(['Check that at least one source document is completed', 'Try again after the AI service is ready'])
      } finally {
        setIsLoading(false)
      }
      return
    }

    if (mode === 'Compare') {
      if (documentIds.length < 2) {
        setAnswer('Open the Compare tab from the left rail to select 2 to 5 completed documents.')
        setSuggestions(['Compare needs at least two completed documents'])
        setIsLoading(false)
        return
      }

      compareMutation.mutate(
        { 
          workspaceId: activeWorkspaceId, 
          data: { documentIds, folderId: folderId || undefined, title: prompt }
        },
        {
          onSuccess: (res) => {
            setAnswer(`Compare job queued. Job status: ${res.status}. Open the Compare tab or Reports after the job completes.`)
            setSuggestions(['Compare runs asynchronously', 'Completed results are stored as reports'])
            setIsLoading(false)
            setPrompt('')
          },
          onError: () => setIsLoading(false)
        }
      )
    } else {
      generateReportMutation.mutate(
        { 
          documentIds, 
          folderId: folderId || undefined, 
          reportType: 'custom_report', 
          customPrompt: prompt 
        },
        {
          onSuccess: (res) => {
            setAnswer(`Report job queued. Job status: ${res.status}. Open Reports after the job completes.`)
            setSuggestions(['Report generation runs asynchronously', 'Refresh Reports to view stored output'])
            setIsLoading(false)
            setPrompt('')
          },
          onError: () => setIsLoading(false)
        }
      )
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
          placeholder="Ask AI about documents in this workspace..."
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
          aria-label={`Run ${mode.toLowerCase()}`}
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </div>
      <p className="mt-1 px-1 text-[10px] text-muted-foreground">
        Ask needs backend Chat/RAG APIs; compare and report actions create AI jobs.
      </p>
    </div>
  )
}

function buildAskContexts(
  activeTab: TabItem | undefined,
  selectedDocumentId: string | null,
  selectedFolderId: string | null,
): ChatMessageContextRequest[] | undefined {
  if (activeTab?.type === 'report') {
    return [{ contextType: 'report', reportId: activeTab.reportId }]
  }

  if (activeTab?.type === 'document') {
    return [{ contextType: 'document', documentId: activeTab.documentId }]
  }

  if (selectedDocumentId) {
    return [{ contextType: 'document', documentId: selectedDocumentId }]
  }

  if (selectedFolderId) {
    return [{ contextType: 'folder', folderId: selectedFolderId, includeSubfolders: true }]
  }

  return undefined
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
