import { useEffect } from 'react'
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { TabStrip } from '@/components/document/TabStrip'
import { DocumentViewer } from '@/components/document/DocumentViewer'
import { ReportViewer } from '@/components/document/ReportViewer'
import { AiInspector } from '@/components/ai/AiInspector'
import { ComparePanel } from '@/components/compare/ComparePanel'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useTabStore } from '@/stores/tabStore'
import { useWorkspace } from '@/hooks/useWorkspaces'
import { useDocuments } from '@/hooks/useDocuments'
import { useReports } from '@/hooks/useReports'
import { useAiJobs } from '@/hooks/useAiJobs'
import { useUiStore } from '@/stores/uiStore'
import { StatusChip } from '@/components/document/StatusChip'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  FileBarChart2,
  FileText,
  FolderTree,
  GitCompare,
  Loader2,
  Search,
  Sparkles,
  Upload,
} from 'lucide-react'
import type { DocumentDto, ReportDto } from '@/types/api'

export function WorkspacePage() {
  const { workspaceId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setActiveWorkspace } = useWorkspaceStore()
  const { tabs, getActiveTab } = useTabStore()
  const activeTab = getActiveTab()
  const { data: workspace, isLoading, isError } = useWorkspace(workspaceId ?? null)
  const { inspectorOpen, setActiveNavItem, toggleInspector } = useUiStore()
  const { openTab } = useTabStore()

  useEffect(() => {
    setActiveWorkspace(workspaceId ?? null)
    return () => setActiveWorkspace(null)
  }, [setActiveWorkspace, workspaceId])

  useEffect(() => {
    if (!workspaceId) return

    const panel = searchParams.get('panel')
    const tool = searchParams.get('tool')

    if (panel === 'chat') {
      setActiveNavItem('chat')
      if (!inspectorOpen) toggleInspector()
    }

    if (tool === 'compare') {
      setActiveNavItem('compare')
      openTab({
        id: 'compare-workspace',
        label: 'Compare',
        type: 'compare',
        closable: true,
      })
    }

    if (tool === 'reports') {
      setActiveNavItem('reports')
      openTab({
        id: 'reports-workspace',
        label: 'Reports',
        type: 'reports',
        closable: true,
      })
    }

    if (panel || tool) {
      navigate(`/workspaces/${workspaceId}`, { replace: true })
    }
  }, [inspectorOpen, navigate, openTab, searchParams, setActiveNavItem, toggleInspector, workspaceId])

  if (!workspaceId) {
    return <Navigate to="/dashboard" replace />
  }

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] w-screen items-center justify-center bg-background text-muted-foreground">
        <Loader2 className="h-7 w-7 animate-spin text-primary" />
      </div>
    )
  }

  if (isError) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AppShell rightPanel={<AiInspector />}>
      <TabStrip />
      {tabs.length > 0 && activeTab ? (
        <>
          {activeTab.type === 'document' && <DocumentViewer />}
          {activeTab.type === 'report' && <ReportViewer />}
          {activeTab.type === 'compare' && <ComparePanel />}
          {activeTab.type === 'reports' && <ReportsPanel workspaceId={workspaceId} />}
        </>
      ) : (
        <WorkspaceHome workspaceId={workspaceId} workspaceName={workspace?.name ?? 'Workspace'} />
      )}
    </AppShell>
  )
}

function ReportsPanel({ workspaceId }: { workspaceId: string }) {
  const { data: reports = [], isLoading } = useReports(workspaceId)
  const { openTab } = useTabStore()

  const openReport = (report: ReportDto) => {
    openTab({
      id: `report-${report.id}`,
      label: report.title,
      type: 'report',
      reportId: report.id,
      closable: true,
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-surface-50">
      <header className="flex min-h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-surface-0 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold leading-tight text-surface-900">Reports</h1>
          <p className="mt-1 text-sm text-surface-500">
            Open generated reports without leaving the workspace context.
          </p>
        </div>
        <FileBarChart2 className="h-5 w-5 text-primary-600" />
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto p-5">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : reports.length > 0 ? (
          <div className="mx-auto max-w-4xl overflow-hidden rounded-lg border border-border bg-surface-0">
            {reports.map((report) => (
              <button
                key={report.id}
                type="button"
                onClick={() => openReport(report)}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-4 text-left last:border-b-0 hover:bg-muted/60"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-foreground">{report.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{report.reportType.replace(/_/g, ' ')}</span>
                    <span>{new Date(report.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          <div className="mx-auto flex min-h-[360px] max-w-md flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
              <FileBarChart2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">No reports yet</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Generate a report from the AI inspector or run Compare and save the result as a report.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

function WorkspaceHome({ workspaceId, workspaceName }: { workspaceId: string; workspaceName: string }) {
  const { data: documents = [], isLoading: documentsLoading } = useDocuments(workspaceId)
  const { data: reports = [] } = useReports(workspaceId)
  const { data: jobs = [] } = useAiJobs(workspaceId)
  const { inspectorOpen, openUploadModal, setCommandPaletteOpen, setActiveNavItem, toggleInspector } = useUiStore()
  const { openTab } = useTabStore()

  const completed = documents.filter((doc) => doc.status === 'completed').length
  const processing = documents.filter((doc) => doc.status === 'processing' || doc.status === 'uploaded').length
  const failed = documents.filter((doc) => doc.status === 'failed').length
  const readyRate = documents.length ? Math.round((completed / documents.length) * 100) : 0
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)
  const activeJobs = jobs.filter((job) => job.status === 'queued' || job.status === 'processing').length

  const openDocument = (document: DocumentDto) => {
    openTab({
      id: `doc-${document.id}`,
      label: document.originalFileName,
      type: 'document',
      documentId: document.id,
      closable: true,
    })
  }

  const startCompare = () => {
    openTab({
      id: 'compare-workspace',
      label: 'Compare',
      type: 'compare',
      closable: true,
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-surface-50">
      <div className="mx-auto flex w-full max-w-[1180px] flex-1 flex-col gap-4 px-4 py-4 lg:px-5">
        <section className="grid gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-lg border border-border bg-white p-5">
            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <FolderTree className="h-4 w-4" />
                  <span className="truncate">Workspace command center</span>
                </div>
                <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
                  {workspaceName}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
                  Upload project documents, let AI classify the content, then review scope, risks, gaps, and next actions from one place.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={() => openUploadModal()} className="h-9">
                  <Upload className="h-4 w-4" />
                  Upload
                </Button>
                <Button variant="outline" onClick={startCompare} className="h-9">
                  <GitCompare className="h-4 w-4" />
                  Compare
                </Button>
                <Button variant="ghost" onClick={() => setCommandPaletteOpen(true)} className="h-9">
                  <Search className="h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric label="Documents" value={documents.length} detail={`${completed} ready`} icon={FileText} />
              <Metric label="AI readiness" value={`${readyRate}%`} detail={`${processing} processing`} icon={Sparkles} />
              <Metric label="Reports" value={reports.length} detail="stored outputs" icon={FileBarChart2} />
              <Metric label="Needs review" value={failed} detail={`${activeJobs} active jobs`} icon={AlertTriangle} tone={failed > 0 ? 'danger' : 'neutral'} />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">AI workflow</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Best path for project docs after upload.
                </p>
              </div>
              <Sparkles className="h-5 w-5 text-ai-500" />
            </div>

            <div className="mt-5 space-y-3">
              <WorkflowStep done={documents.length > 0} label="Collect source docs" detail="PRD, MVP spec, meeting note, technical doc" />
              <WorkflowStep done={completed > 0} label="Review intelligence" detail="Scope, decisions, risks, gaps, next actions" />
              <WorkflowStep done={reports.length > 0} label="Generate team report" detail="Turn extracted insights into Markdown output" />
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveNavItem('chat')
                if (!inspectorOpen) toggleInspector()
              }}
              className="mt-5 flex w-full items-center justify-between rounded-md border border-ai-100 bg-ai-50 px-3 py-2 text-left text-sm font-medium text-ai-700 transition-colors hover:bg-ai-100"
            >
              Ask AI about this workspace
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="grid min-h-[360px] gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-lg border border-border bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Recent documents</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Open a document to inspect AI summary and structured insights.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => openUploadModal()}>
                <Upload className="h-4 w-4" />
                Add
              </Button>
            </div>

            {documentsLoading ? (
              <div className="space-y-3 p-5">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-md bg-muted" />
                ))}
              </div>
            ) : recentDocuments.length > 0 ? (
              <div className="divide-y divide-border">
                {recentDocuments.map((document) => (
                  <button
                    key={document.id}
                    type="button"
                    onClick={() => openDocument(document)}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-muted/60"
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm font-medium text-foreground">
                          {document.originalFileName}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{document.fileType.toUpperCase()}</span>
                        {document.documentType && <span>{formatDocumentType(document.documentType)}</span>}
                        <span>Updated {new Date(document.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <StatusChip status={document.status} />
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-border bg-muted">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">No documents yet</h3>
                <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                  Start with a PRD, MVP spec, proposal, meeting note, technical doc, or project report.
                </p>
                <Button className="mt-4" onClick={() => openUploadModal()}>
                  <Upload className="h-4 w-4" />
                  Upload first document
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-white p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Workspace health</h2>
            </div>

            <div className="mt-5 space-y-4">
              <HealthRow label="Ready for RAG" value={completed} total={documents.length} />
              <HealthRow label="Still processing" value={processing} total={documents.length} />
              <HealthRow label="Failed processing" value={failed} total={documents.length} tone="danger" />
            </div>

            <div className="mt-6 rounded-md border border-border bg-muted/40 p-3">
              <h3 className="text-xs font-semibold text-foreground">Recommended next step</h3>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {documents.length === 0
                  ? 'Upload a project document to let AI build the first workspace summary.'
                  : failed > 0
                    ? 'Open failed documents and retry processing before running reports.'
                    : completed >= 2
                      ? 'Run Compare to detect conflicts, missing details, and next actions across documents.'
                      : 'Open the completed document and review its risks, gaps, and next actions.'}
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function Metric({
  label,
  value,
  detail,
  icon: Icon,
  tone = 'neutral',
}: {
  label: string
  value: string | number
  detail: string
  icon: typeof FileText
  tone?: 'neutral' | 'danger'
}) {
  return (
    <div className="rounded-md border border-border bg-surface-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon className={tone === 'danger' ? 'h-4 w-4 text-danger-600' : 'h-4 w-4 text-muted-foreground'} />
      </div>
      <div className="mt-3 text-2xl font-semibold leading-none tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
  )
}

function WorkflowStep({ done, label, detail }: { done: boolean; label: string; detail: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5">
        {done ? (
          <CheckCircle2 className="h-4 w-4 text-success-600" />
        ) : (
          <div className="h-4 w-4 rounded-full border border-border bg-background" />
        )}
      </div>
      <div>
        <div className="text-sm font-medium text-foreground">{label}</div>
        <div className="mt-0.5 text-xs leading-5 text-muted-foreground">{detail}</div>
      </div>
    </div>
  )
}

function HealthRow({
  label,
  value,
  total,
  tone = 'neutral',
}: {
  label: string
  value: number
  total: number
  tone?: 'neutral' | 'danger'
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{value}/{total}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={tone === 'danger' ? 'h-full rounded-full bg-danger-500' : 'h-full rounded-full bg-ai-500'}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function formatDocumentType(value: string) {
  return value.replace(/_/g, ' ')
}
