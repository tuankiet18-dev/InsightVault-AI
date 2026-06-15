import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2, Clock, FileText, GitCompare, Sparkles, XCircle } from 'lucide-react'
import { DocumentSelector } from './DocumentSelector'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useDocuments } from '@/hooks/useDocuments'
import { useCompareDocuments } from '@/hooks/useReports'
import { useAiJob } from '@/hooks/useAiJobs'
import { useTabStore } from '@/stores/tabStore'
import type { AiJobDto } from '@/types/api'

export function ComparePanel() {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
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

  const openGeneratedReport = useCallback((reportId: string) => {
    openTab({
      id: `report-${reportId}`,
      label: 'Comparison report',
      type: 'report',
      reportId,
      closable: true,
    })
  }, [openTab])

  useEffect(() => {
    if (activeJob?.status !== 'completed' || !activeJob.reportId) {
      return
    }

    if (openedReportIdRef.current === activeJob.reportId) {
      return
    }

    openedReportIdRef.current = activeJob.reportId
    openGeneratedReport(activeJob.reportId)
  }, [activeJob?.reportId, activeJob?.status, openGeneratedReport])

  const handleCompare = () => {
    if (selectedIds.length < 2 || !activeWorkspaceId) return
    
    setQueuedJob(null)
    openedReportIdRef.current = null
    
    compareMutation.mutate(
      { workspaceId: activeWorkspaceId, data: { documentIds: selectedIds } },
      {
        onSuccess: (job) => setQueuedJob(job),
      }
    )
  }

  const openComparisonReport = () => {
    if (activeJob?.reportId) {
      openGeneratedReport(activeJob.reportId)
      return
    }

    openReports()
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
              disabled={activeJob?.status !== 'completed'}
              onClick={openComparisonReport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border bg-surface-0 hover:bg-surface-50 transition-colors disabled:opacity-50 shadow-sm"
            >
              <FileText className="w-4 h-4 text-surface-500" />
              Open Report
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
            <div className="mx-auto flex h-full max-w-xl flex-col items-center justify-center text-center">
              <JobStatusCard job={activeJob} onOpenReport={openComparisonReport} />
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {selectedDocs.map((doc, idx) => (
                  <div key={doc.id} className="flex max-w-[220px] items-center gap-1.5 rounded-md border border-border bg-surface-0 px-2.5 py-1.5 text-sm">
                    <span className="font-semibold text-primary">Doc {idx + 1}</span>
                    <span className="truncate">{doc.originalFileName}</span>
                  </div>
                ))}
              </div>
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

function JobStatusCard({ job, onOpenReport }: { job: AiJobDto; onOpenReport: () => void }) {
  const isCompleted = job.status === 'completed'
  const isFailed = job.status === 'failed' || job.status === 'cancelled'

  return (
    <section className="w-full rounded-lg border border-border bg-surface-0 p-6 shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {isCompleted ? (
          <CheckCircle2 className="h-6 w-6 text-success-600" />
        ) : isFailed ? (
          <XCircle className="h-6 w-6 text-danger-600" />
        ) : (
          <Clock className="h-6 w-6 text-warning-600" />
        )}
      </div>
      <h2 className="mt-4 text-xl font-semibold text-surface-900">
        {isCompleted ? 'Comparison complete' : isFailed ? 'Comparison failed' : 'Comparison queued'}
      </h2>
      <p className="mt-2 text-sm leading-6 text-surface-600">
        {isCompleted
          ? 'The result is persisted as a comparison report. Open the generated report to review it in the workspace.'
          : isFailed
            ? job.errorMessage || 'The compare job failed. Check AI Jobs or retry after reviewing source documents.'
            : 'AI is comparing the selected documents asynchronously. This view will update as the job status changes.'}
      </p>
      <div className="mt-4 rounded-md border border-border bg-surface-50 px-3 py-2 text-xs text-surface-500">
        Job status: <span className="font-semibold capitalize text-surface-700">{job.status}</span>
      </div>
      {isCompleted && (
        <button
          type="button"
          onClick={onOpenReport}
          className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground"
        >
          Open Report
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </section>
  )
}
