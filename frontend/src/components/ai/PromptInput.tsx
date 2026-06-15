import { useAiStore } from '@/stores/aiStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCompareDocuments, useGenerateReport } from '@/hooks/useReports'

export function PromptInput() {
  const { prompt, setPrompt, mode, setAnswer, setCitations, setSuggestions, isLoading, setIsLoading } = useAiStore()
  const { activeWorkspaceId, selectedDocumentId, selectedFolderId } = useWorkspaceStore()
  
  const compareMutation = useCompareDocuments()
  const generateReportMutation = useGenerateReport(activeWorkspaceId || '')
  
  const handleRun = () => {
    if (!prompt.trim() || isLoading || !activeWorkspaceId) return
    
    setIsLoading(true)
    setAnswer(null)
    setCitations([])
    setSuggestions([])

    const documentIds = selectedDocumentId ? [selectedDocumentId] : []
    const folderId = selectedFolderId

    if (mode === 'Ask') {
      setAnswer('Workspace chat is designed for the right inspector, but backend Chat/RAG session APIs are not implemented yet.')
      setSuggestions(['Use Compare for async document comparison', 'Use Report mode to queue a report job'])
      setIsLoading(false)
      setPrompt('')
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
