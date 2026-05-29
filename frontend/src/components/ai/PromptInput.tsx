import { useAiStore } from '@/stores/aiStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { Sparkles, CornerDownLeft } from 'lucide-react'
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
    <div className="flex flex-col gap-2 mt-4 relative">
      <div className="flex items-center justify-between px-1">
        <label htmlFor="ai-prompt" className="text-xs font-semibold text-surface-600 uppercase tracking-wider">
          Prompt
        </label>
        <span className="text-[10px] text-surface-400">Press Enter to run</span>
      </div>
      
      <div className="relative">
        <textarea
          id="ai-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`What would you like to ${mode.toLowerCase()}?`}
          className="w-full min-h-[100px] max-h-[300px] p-3 rounded-lg border border-border bg-surface-0 focus:outline-none focus:ring-2 focus:ring-ai-500/50 resize-y text-sm"
        />
      </div>

      <button
        onClick={handleRun}
        disabled={isLoading || !prompt.trim()}
        className={cn(
          "flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm",
          isLoading || !prompt.trim()
            ? "bg-surface-100 text-surface-400 cursor-not-allowed"
            : "bg-ai-500 text-white hover:bg-ai-600"
        )}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            <span>Analyzing...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Run {mode.toLowerCase()}</span>
            <CornerDownLeft className="w-3.5 h-3.5 ml-1 opacity-50" />
          </>
        )}
      </button>
    </div>
  )
}
