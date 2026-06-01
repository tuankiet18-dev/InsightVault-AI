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

    if (mode === 'Compare') {
      compareMutation.mutate(
        { 
          workspaceId: activeWorkspaceId, 
          data: { documentIds, folderId: folderId || undefined, title: prompt }
        },
        {
          onSuccess: (res) => {
            setAnswer(res.rawMarkdown || 'Comparison complete.')
            setSuggestions(res.recommendations || [])
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
            // Because our MSW generateReport doesn't return the exact same shape as compare,
            // we handle it here loosely. The mock just returns a report object.
            setAnswer((res as import('@/types/api').ReportDto)?.markdownContent || 'Report generated.')
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
          placeholder="Hỏi AI về tài liệu trong workspace..."
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
      <p className="mt-1 px-1 text-[10px] text-muted-foreground">Câu trả lời sẽ kèm trích nguồn từ tài liệu.</p>
    </div>
  )
}
