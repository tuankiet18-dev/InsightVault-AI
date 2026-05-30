import { useState } from 'react'
import { GitCompare, Sparkles, FileText } from 'lucide-react'
import { DocumentSelector } from './DocumentSelector'
import { CompareResult } from './CompareResult'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useDocuments } from '@/hooks/useDocuments'
import { useCompareDocuments } from '@/hooks/useReports'
import type { CompareResponse } from '@/types/api'

export function ComparePanel() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<CompareResponse | null>(null)
  const { activeWorkspaceId } = useWorkspaceStore()
  const { data: documents = [] } = useDocuments(activeWorkspaceId)
  const compareMutation = useCompareDocuments()

  const handleCompare = () => {
    if (selectedIds.length < 2 || !activeWorkspaceId) return
    
    setIsAnalyzing(true)
    setResult(null)
    
    compareMutation.mutate(
      { workspaceId: activeWorkspaceId, data: { documentIds: selectedIds } },
      {
        onSuccess: (res) => {
          setResult(res)
          setIsAnalyzing(false)
        },
        onError: () => {
          setIsAnalyzing(false)
        }
      }
    )
  }

  const selectedDocs = documents.filter(d => selectedIds.includes(d.id))

  return (
    <div className="flex flex-col h-full bg-surface-50 overflow-hidden">
      <header className="px-6 py-4 border-b border-border bg-surface-0 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-warning-50 rounded-lg text-warning-600">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-surface-900 leading-tight">Document Comparison</h1>
              <p className="text-sm text-surface-500">Find gaps, conflicts, and missing information.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              disabled={!result}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-surface-0 hover:bg-surface-50 transition-colors disabled:opacity-50 shadow-sm"
            >
              <FileText className="w-4 h-4 text-surface-500" />
              Save as Report
            </button>
            <button
              onClick={handleCompare}
              disabled={selectedIds.length < 2 || isAnalyzing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-ai-500 text-white hover:bg-ai-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Run AI Comparison
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar: Document Selector */}
        <aside className="w-80 border-r border-border p-4 shrink-0 flex flex-col bg-surface-0">
          <DocumentSelector 
            selectedIds={selectedIds}
            onChange={setSelectedIds}
          />
        </aside>

        {/* Main Content: Results */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative scroll-smooth">
          {result ? (
            <div className="max-w-5xl mx-auto pb-12">
              <div className="flex flex-wrap items-center gap-2 mb-8 p-4 bg-surface-0 border border-border rounded-xl shadow-sm">
                <span className="text-sm font-medium text-surface-500 mr-2">Comparing:</span>
                {selectedDocs.map((doc, idx) => (
                  <div key={doc.id} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-100 border border-surface-200 text-sm">
                    <span className="font-semibold text-primary-600">Doc {idx + 1}:</span>
                    <span className="truncate max-w-[150px]">{doc.originalFileName}</span>
                  </div>
                ))}
              </div>
              
              <CompareResult result={result} />
            </div>
          ) : isAnalyzing ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-50/80 backdrop-blur-sm z-10">
              <div className="w-16 h-16 border-4 border-surface-200 border-t-ai-500 rounded-full animate-spin mb-6" />
              <h2 className="text-xl font-bold text-surface-900 mb-2">Analyzing documents...</h2>
              <p className="text-surface-500 text-center max-w-sm">
                AI is reading the selected documents, finding semantic overlaps, and identifying contradictions.
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-20 h-20 rounded-3xl bg-warning-50 flex items-center justify-center text-warning-500 mb-6 rotate-12">
                <GitCompare className="w-10 h-10" />
              </div>
              <h2 className="text-2xl font-bold text-surface-900 mb-3">Compare Documents</h2>
              <p className="text-surface-600 mb-8">
                Select 2 to 5 completed documents from the sidebar to run an AI-powered gap analysis. 
                Discover missing requirements, potential conflicts, and alignment issues instantly.
              </p>
              <div className="flex items-center justify-center gap-6 text-sm text-surface-500 w-full">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center font-bold text-surface-600">1</div>
                  <span>Select</span>
                </div>
                <div className="h-px bg-border flex-1" />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center font-bold text-surface-600">2</div>
                  <span>Compare</span>
                </div>
                <div className="h-px bg-border flex-1" />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center font-bold text-surface-600">3</div>
                  <span>Report</span>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
