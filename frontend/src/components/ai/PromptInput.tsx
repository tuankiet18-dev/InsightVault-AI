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
import { buildChatContexts } from '@/lib/chatContext'
import type { ChatSourceDto } from '@/types/api'

export function PromptInput() {
  const { prompt, setPrompt, mode, setAnswer, setCitations, setSuggestions, isLoading, setIsLoading } = useAiStore()
  const { activeWorkspaceId, selectedDocumentId, selectedFolderId } = useWorkspaceStore()
  const { activeSessionId, setActiveSession } = useChatStore()
  const { getActiveTab, openTab } = useTabStore()
  const activeTab = getActiveTab()
  const queryClient = useQueryClient()
  const { data: sessions = [] } = useChatSessions(activeWorkspaceId)
  
  const compareMutation = useCompareDocuments()
  const generateReportMutation = useGenerateReport(activeWorkspaceId || '')
  const placeholder = mode === 'Ask'
    ? 'Ask about the selected document, folder, or workspace...'
    : mode === 'Compare'
      ? 'Describe what you want to compare...'
      : 'Describe the report you want AI to generate...'
  
  const handleRun = async () => {
    if (!prompt.trim() || isLoading || !activeWorkspaceId) return
    
    setIsLoading(true)
    setAnswer(null)
    setCitations([])
    setSuggestions([])

    const activeDocumentId = selectedDocumentId
      ?? (!selectedFolderId && activeTab?.type === 'document' ? activeTab.documentId : null)
    const documentIds = activeDocumentId ? [activeDocumentId] : []
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
          contexts: buildChatContexts(activeTab, selectedDocumentId, selectedFolderId),
        })

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
      if (!folderId && documentIds.length < 2) {
        openTab({
          id: 'compare-workspace',
          label: 'Compare',
          type: 'compare',
          closable: true,
        })
        setAnswer('Compare needs 2+ completed documents. I opened Compare for manual selection.')
        setSuggestions(['Select documents in Compare', 'Or select a folder and run Compare here'])
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
            setAnswer(`Compare queued: ${res.status}.`)
            setSuggestions(['Open Reports after it completes'])
            setIsLoading(false)
            setPrompt('')
          },
          onError: () => setIsLoading(false)
        }
      )
    } else {
      if (documentIds.length === 0 && !folderId) {
        setAnswer('Report needs a document or folder scope.')
        setSuggestions(['Open a completed document', 'Select a folder'])
        setIsLoading(false)
        return
      }

      generateReportMutation.mutate(
        { 
          documentIds, 
          folderId: folderId || undefined, 
          reportType: 'custom_report', 
          customPrompt: prompt 
        },
        {
          onSuccess: (res) => {
            setAnswer(`Report queued: ${res.status}.`)
            setSuggestions(['Open Reports after it completes'])
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
          aria-label={`Run ${mode.toLowerCase()}`}
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
