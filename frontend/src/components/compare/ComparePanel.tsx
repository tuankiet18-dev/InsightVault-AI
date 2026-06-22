import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock, File, GitCompare, Plus, Sparkles, XCircle } from 'lucide-react'
import { DocumentSelector } from './DocumentSelector'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useDocuments } from '@/hooks/useDocuments'
import { useCompareDocuments } from '@/hooks/useReports'
import { useAiJob } from '@/hooks/useAiJobs'
import { useTabStore } from '@/stores/tabStore'
import { cn, getFileTypeColor } from '@/lib/utils'
import type { AiJobDto, DocumentDto } from '@/types/api'
import { Dialog, DialogContent } from '@/components/ui/dialog'

export function ComparePanel() {
  const [docAId, setDocAId] = useState<string | null>(null)
  const [docBId, setDocBId] = useState<string | null>(null)
  const [pickingFor, setPickingFor] = useState<'A' | 'B' | null>(null)
  
  const [queuedJob, setQueuedJob] = useState<AiJobDto | null>(null)
  const { activeWorkspaceId } = useWorkspaceStore()
  const { data: documents = [] } = useDocuments(activeWorkspaceId)
  const compareMutation = useCompareDocuments()
  const { openTab } = useTabStore()
  const { data: latestJob } = useAiJob(queuedJob?.id ?? null)
  const openedReportIdRef = useRef<string | null>(null)
  
  const activeJob = latestJob ?? queuedJob
  const isAnalyzing = activeJob?.status === 'queued' || activeJob?.status === 'processing' || compareMutation.isPending

  const openReports = useCallback(() => {
    openTab({
      id: 'reports-workspace',
      label: 'Reports',
      type: 'reports',
      closable: true,
    })
  }, [openTab])

  const openGeneratedReport = useCallback((reportId: string, docA: DocumentDto | undefined, docB: DocumentDto | undefined) => {
    openTab({
      id: `report-${reportId}`,
      label: 'Comparison report',
      type: 'report',
      reportId,
      closable: true,
      compareDocumentIds: [docA?.id, docB?.id].filter(Boolean) as string[]
    })
  }, [openTab])

  const docA = documents.find(d => d.id === docAId)
  const docB = documents.find(d => d.id === docBId)

  useEffect(() => {
    if (activeJob?.status !== 'completed' || !activeJob.reportId) {
      return
    }

    if (openedReportIdRef.current === activeJob.reportId) {
      return
    }

    openedReportIdRef.current = activeJob.reportId
    openGeneratedReport(activeJob.reportId, docA, docB)
  }, [activeJob?.reportId, activeJob?.status, openGeneratedReport, docA, docB])

  const handleCompare = () => {
    if (!docAId || !docBId || !activeWorkspaceId) return
    
    setQueuedJob(null)
    openedReportIdRef.current = null
    
    compareMutation.mutate(
      { workspaceId: activeWorkspaceId, data: { documentIds: [docAId, docBId] } },
      {
        onSuccess: (job) => setQueuedJob(job),
      }
    )
  }

  const openComparisonReport = () => {
    if (activeJob?.reportId) {
      openGeneratedReport(activeJob.reportId, docA, docB)
      return
    }

    openReports()
  }

  const handleDocumentSelect = (ids: string[]) => {
    const selectedId = ids[0] ?? null
    if (pickingFor === 'A') {
      setDocAId(selectedId)
      if (selectedId === docBId) setDocBId(null)
    } else if (pickingFor === 'B') {
      setDocBId(selectedId)
      if (selectedId === docAId) setDocAId(null)
    }
    setPickingFor(null)
  }

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
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6 lg:p-8 relative scroll-smooth flex flex-col items-center">
        {isAnalyzing ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-50/80 backdrop-blur-sm z-10">
            <div className="w-16 h-16 border-4 border-surface-200 border-t-ai-500 rounded-full animate-spin mb-6" />
            <h2 className="text-xl font-bold text-surface-900 mb-2">
              {compareMutation.isPending ? 'Starting comparison...' : 'Analyzing documents...'}
            </h2>
            <p className="text-surface-500 text-center max-w-sm">
              The backend queued a compare job. Keep this tab open or check Reports after the job completes.
            </p>
          </div>
        ) : activeJob ? (
          <div className="mx-auto w-full max-w-xl mt-12 flex flex-col items-center justify-center text-center">
            <JobStatusCard job={activeJob} onOpenReport={openComparisonReport} />
            <div className="mt-8 flex justify-center gap-4 w-full">
              {docA && (
                <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface-0 px-3 py-2 text-sm shadow-sm">
                  <File className={cn("w-4 h-4 shrink-0", getFileTypeColor(docA.fileType))} />
                  <span className="truncate text-surface-700">{docA.originalFileName}</span>
                </div>
              )}
              {docB && (
                <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-surface-0 px-3 py-2 text-sm shadow-sm">
                  <File className={cn("w-4 h-4 shrink-0", getFileTypeColor(docB.fileType))} />
                  <span className="truncate text-surface-700">{docB.originalFileName}</span>
                </div>
              )}
            </div>
            <button
              className="mt-6 text-sm text-primary hover:underline"
              onClick={() => {
                setQueuedJob(null)
              }}
            >
              Start a new comparison
            </button>
          </div>
        ) : (
          <div className="w-full max-w-4xl mx-auto mt-8 flex flex-col items-center">
            <h2 className="text-2xl font-bold text-surface-900 mb-8">Select Documents to Compare</h2>
            
            <div className="flex flex-col md:flex-row items-stretch gap-6 w-full justify-center">
              {/* Drop Zone A */}
              <DocumentDropZone 
                label="Document A" 
                document={docA} 
                onPick={() => setPickingFor('A')} 
                onRemove={() => setDocAId(null)}
              />
              
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center text-surface-400">
                  <GitCompare className="w-6 h-6" />
                </div>
              </div>

              {/* Drop Zone B */}
              <DocumentDropZone 
                label="Document B" 
                document={docB} 
                onPick={() => setPickingFor('B')} 
                onRemove={() => setDocBId(null)}
              />
            </div>
            
            <div className="mt-12">
              <button
                onClick={handleCompare}
                disabled={!docAId || !docBId || isAnalyzing}
                className={cn(
                  "flex items-center gap-3 px-8 py-3.5 rounded-full text-base font-bold shadow-lg transition-all",
                  docAId && docBId && !isAnalyzing
                    ? "bg-ai-500 text-white hover:bg-ai-600 hover:-translate-y-0.5 hover:shadow-xl cursor-pointer"
                    : "bg-surface-200 text-surface-400 cursor-not-allowed shadow-none"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-surface-400 border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Run AI Comparison
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </main>

      <Dialog open={pickingFor !== null} onOpenChange={(open) => !open && setPickingFor(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden h-[500px] flex flex-col gap-0 border-0 bg-transparent shadow-none">
          {pickingFor && (
            <DocumentSelector 
              selectedIds={pickingFor === 'A' ? (docAId ? [docAId] : []) : (docBId ? [docBId] : [])}
              onChange={handleDocumentSelect}
              maxSelections={1}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DocumentDropZone({ 
  label, 
  document, 
  onPick, 
  onRemove 
}: { 
  label: string, 
  document?: DocumentDto, 
  onPick: () => void,
  onRemove: () => void
}) {
  if (document) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center border-2 border-border bg-surface-0 rounded-2xl p-6 relative group transition-all">
        <button 
          onClick={onRemove}
          className="absolute top-3 right-3 text-surface-400 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <XCircle className="w-5 h-5" />
        </button>
        <div className="text-sm font-semibold text-surface-500 mb-4">{label}</div>
        <File className={cn("w-12 h-12 mb-3", getFileTypeColor(document.fileType))} />
        <div className="font-medium text-surface-900 text-center line-clamp-2 px-2 break-all w-full">
          {document.originalFileName}
        </div>
        <button 
          onClick={onPick}
          className="mt-4 text-sm text-primary hover:underline"
        >
          Change document
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={onPick}
      className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-border bg-surface-50/50 hover:bg-surface-100 hover:border-primary/50 transition-all rounded-2xl p-8 min-h-[240px] group"
    >
      <div className="w-12 h-12 rounded-full bg-surface-0 border border-border flex items-center justify-center text-surface-400 group-hover:text-primary group-hover:border-primary/50 transition-colors mb-4">
        <Plus className="w-6 h-6" />
      </div>
      <div className="text-lg font-semibold text-surface-700 group-hover:text-surface-900 transition-colors mb-1">
        Select {label}
      </div>
      <div className="text-sm text-surface-500 text-center">
        Click to pick a document from your workspace
      </div>
    </button>
  )
}

function JobStatusCard({ job, onOpenReport }: { job: AiJobDto; onOpenReport: () => void }) {
  const isCompleted = job.status === 'completed'
  const isFailed = job.status === 'failed' || job.status === 'cancelled'

  return (
    <section className="w-full rounded-2xl border border-border bg-surface-0 p-8 shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground mb-6">
        {isCompleted ? (
          <CheckCircle2 className="h-8 w-8 text-success-600" />
        ) : isFailed ? (
          <XCircle className="h-8 w-8 text-danger-600" />
        ) : (
          <Clock className="h-8 w-8 text-warning-600" />
        )}
      </div>
      <h2 className="text-2xl font-bold text-surface-900 mb-3">
        {isCompleted ? 'Comparison complete' : isFailed ? 'Comparison failed' : 'Comparison queued'}
      </h2>
      <p className="text-surface-600 max-w-md mx-auto">
        {isCompleted
          ? 'The AI gap analysis is ready. Open the report to review the differences side-by-side.'
          : isFailed
            ? job.errorMessage || 'The compare job failed. Please try again with different documents.'
            : 'AI is analyzing your documents...'}
      </p>
      
      {isCompleted && (
        <button
          type="button"
          onClick={onOpenReport}
          className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Open Report
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </section>
  )
}
