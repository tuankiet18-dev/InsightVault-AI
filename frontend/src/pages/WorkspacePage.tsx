import { useEffect, useRef, useState } from 'react'
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
import { useReports, useDeleteReport } from '@/hooks/useReports'
import { useFolders } from '@/hooks/useFolders'
import { useUiStore } from '@/stores/uiStore'
import { StatusChip } from '@/components/document/StatusChip'
import { ConfirmModal } from '@/components/ui/ConfirmModal'
import { Button } from '@/components/ui/button'
import { getFileTypeColor, cn } from '@/lib/utils'
import {
  ArrowRight,
  BarChart3,
  Bot,
  Download,
  File,
  FileBarChart2,
  FileText,
  FolderPlus,
  FolderTree,
  GitCompare,
  Image as ImageIcon,
  Loader2,
  Share2,
  Sparkles,
  Trash2,
  Upload,
  UploadCloud,
} from 'lucide-react'
import type { DocumentDto, ReportDto } from '@/types/api'

export function WorkspacePage() {
  const { workspaceId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setActiveWorkspace } = useWorkspaceStore()
  const { tabs, getActiveTab, resetTabs } = useTabStore()
  const activeTab = getActiveTab()
  const { data: workspace, isLoading, isError } = useWorkspace(workspaceId ?? null)
  const { inspectorOpen, setActiveNavItem, toggleInspector } = useUiStore()
  const { openTab } = useTabStore()
  const previousWorkspaceIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (previousWorkspaceIdRef.current && previousWorkspaceIdRef.current !== workspaceId) {
      resetTabs()
    }
    previousWorkspaceIdRef.current = workspaceId ?? null
    setActiveWorkspace(workspaceId ?? null)
    return () => setActiveWorkspace(null)
  }, [resetTabs, setActiveWorkspace, workspaceId])

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
      <AppShell rightPanel={<AiInspector />}>
        <div className="flex min-h-0 flex-1 items-center justify-center bg-background text-muted-foreground">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      </AppShell>
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

import { ShareReportModal } from '@/components/report/ShareReportModal'

function ReportsPanel({ workspaceId }: { workspaceId: string }) {
  const { data: reports = [], isLoading } = useReports(workspaceId)
  const { data: documents = [] } = useDocuments(workspaceId)
  const { openTab } = useTabStore()
  const deleteMutation = useDeleteReport(workspaceId)
  const [reportToDelete, setReportToDelete] = useState<ReportDto | null>(null)
  const [reportToShare, setReportToShare] = useState<ReportDto | null>(null)

  const openReport = (report: ReportDto) => {
    openTab({
      id: `report-${report.id}`,
      label: report.title,
      type: 'report',
      reportId: report.id,
      closable: true,
      compareDocumentIds: report.sourceDocuments
    })
  }

  const handleDelete = () => {
    if (!reportToDelete) return
    deleteMutation.mutate(reportToDelete.id, {
      onSuccess: () => setReportToDelete(null)
    })
  }

  // Time grouping
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const weekAgo = new Date(today)
  weekAgo.setDate(weekAgo.getDate() - 7)

  const todayReports: ReportDto[] = []
  const weekReports: ReportDto[] = []
  const olderReports: ReportDto[] = []

  const sortedReports = [...reports].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  sortedReports.forEach(r => {
    const d = new Date(r.updatedAt)
    if (d >= today) todayReports.push(r)
    else if (d >= weekAgo) weekReports.push(r)
    else olderReports.push(r)
  })

  const renderReportGroup = (title: string, groupReports: ReportDto[]) => {
    if (groupReports.length === 0) return null
    return (
      <div className="mb-8 last:mb-0">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-surface-400 mb-3 ml-1">{title}</h3>
        <div className="flex flex-col gap-3">
          {groupReports.map(report => {
            const isComparison = report.reportType === 'comparison_report' && report.sourceDocuments && report.sourceDocuments.length > 0
            const comparedDocs = isComparison 
              ? report.sourceDocuments.map(id => documents.find(d => d.id === id)).filter(Boolean) as DocumentDto[]
              : []

            let displayTitle = report.title
            if (displayTitle.startsWith('Comparison Report') && comparedDocs.length === 2) {
              displayTitle = `So sánh: ${comparedDocs[0].originalFileName} & ${comparedDocs[1].originalFileName}`
            }

            return (
              <div
                key={report.id}
                onClick={() => openReport(report)}
                className="group relative flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-surface-0 px-5 py-4 text-left shadow-sm transition-all hover:border-primary-200 hover:bg-surface-50 hover:shadow-md cursor-pointer"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-base font-semibold text-surface-900">{displayTitle}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-xs text-surface-500">{new Date(report.updatedAt).toLocaleDateString()}</span>
                    <span className="h-1 w-1 rounded-full bg-surface-300" />
                    <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">{report.reportType.replace(/_/g, ' ')}</span>
                  </div>
                  
                  {isComparison && comparedDocs.length > 0 && (
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {comparedDocs.map((doc, idx) => (
                          <div key={doc.id} className="flex items-center gap-1 max-w-[200px]">
                            {idx > 0 && <GitCompare className="h-3 w-3 text-surface-400 mx-1 shrink-0" />}
                            <FileIcon type={doc.fileType} />
                            <span className="truncate text-xs text-surface-600 font-medium" title={doc.originalFileName}>{doc.originalFileName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 bg-surface-0/95 backdrop-blur-sm p-1.5 rounded-lg shadow-sm border border-border">
                  <button 
                    onClick={(e) => { e.stopPropagation(); alert('Tính năng tải PDF sẽ sớm được cập nhật!') }} 
                    className="p-1.5 hover:bg-surface-100 rounded-md text-surface-500 hover:text-surface-900 transition-colors" 
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setReportToShare(report) }} 
                    className="p-1.5 hover:bg-surface-100 rounded-md text-surface-500 hover:text-surface-900 transition-colors" 
                    title="Share Report"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <div className="w-px h-4 bg-border mx-0.5" />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setReportToDelete(report) }} 
                    className="p-1.5 hover:bg-danger-50 rounded-md text-surface-500 hover:text-danger-600 transition-colors" 
                    title="Delete Report"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
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

      <main className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-4xl">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="h-24 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : reports.length > 0 ? (
            <div className="pb-8">
              {renderReportGroup('Hôm nay', todayReports)}
              {renderReportGroup('Tuần này', weekReports)}
              {renderReportGroup('Cũ hơn', olderReports)}
            </div>
          ) : (
            <div className="mt-12 flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-0/50 p-8 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-primary-50 text-primary-600 shadow-sm ring-1 ring-primary-100/50">
                <FileBarChart2 className="h-10 w-10" />
              </div>
              <h2 className="text-2xl font-bold text-surface-900">Chưa có báo cáo nào</h2>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-surface-500">
                Chạy tính năng Compare (So sánh) hoặc yêu cầu AI tạo báo cáo để xem kết quả được lưu trữ tại đây.
              </p>
              <Button 
                className="mt-8 rounded-full px-8 shadow-md hover:-translate-y-0.5 hover:shadow-lg transition-all" 
                onClick={() => openTab({ id: 'compare-workspace', label: 'Compare', type: 'compare', closable: true })}
              >
                <GitCompare className="mr-2 h-4 w-4" />
                Tạo báo cáo mới ngay
              </Button>
            </div>
          )}
        </div>
      </main>

      <ConfirmModal
        isOpen={!!reportToDelete}
        onClose={() => setReportToDelete(null)}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
        title="Xóa Báo Cáo"
        description={`Bạn có chắc chắn muốn xóa báo cáo "${reportToDelete?.title}" không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa Báo Cáo"
      />

      <ShareReportModal
        isOpen={!!reportToShare}
        onClose={() => setReportToShare(null)}
        workspaceId={workspaceId}
        report={reportToShare}
      />
    </div>
  )
}

function WorkspaceHome({ workspaceId, workspaceName }: { workspaceId: string; workspaceName: string }) {
  const { data: rawDocuments = [], isLoading: documentsLoading } = useDocuments(workspaceId)
  const documents = rawDocuments.filter(doc => doc.folderId)
  const { data: folders = [] } = useFolders(workspaceId)
  const { data: reports = [] } = useReports(workspaceId)
  const { inspectorOpen, openUploadModal, openCreateFolderModal, setActiveNavItem, toggleInspector } = useUiStore()

  const isWorkspaceEmpty = documents.length === 0 && folders.length === 0
  const { openTab } = useTabStore()

  const completed = documents.filter((doc) => doc.status === 'completed').length
  const processing = documents.filter((doc) => doc.status === 'processing' || doc.status === 'uploaded').length
  const failed = documents.filter((doc) => doc.status === 'failed').length
  const readyRate = documents.length ? Math.round((completed / documents.length) * 100) : 0
  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

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
          <div className="rounded-lg border border-border bg-surface-0 p-5">
            <div className="flex flex-col gap-4">
              <div className="min-w-0">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <FolderTree className="h-4 w-4" />
                  <span className="truncate">Workspace</span>
                </div>
                <h1 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
                  {workspaceName}
                </h1>
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
              </div>
            </div>

            <div className="mt-5">
              {isWorkspaceEmpty ? (
                <div className="grid gap-3 sm:grid-cols-3">
                  <div 
                    onClick={() => openCreateFolderModal()}
                    className="group cursor-pointer rounded-xl border border-border bg-surface-0 p-5 transition-all hover:border-primary-300 hover:shadow-md"
                  >
                    <div className="mb-3 inline-flex rounded-lg bg-primary-50 p-2 text-primary-600">
                      <FolderPlus className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-surface-900 group-hover:text-primary-700 transition-colors">Create a folder</h3>
                    <p className="mt-1 text-xs leading-relaxed text-surface-500">Create a folder to organize your documents.</p>
                  </div>
                  
                  <div 
                    onClick={() => openUploadModal()}
                    className="group cursor-pointer rounded-xl border border-border bg-surface-0 p-5 transition-all hover:border-primary-300 hover:shadow-md"
                  >
                    <div className="mb-3 inline-flex rounded-lg bg-primary-50 p-2 text-primary-600">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-surface-900 group-hover:text-primary-700 transition-colors">Upload documents</h3>
                    <p className="mt-1 text-xs leading-relaxed text-surface-500">Upload PDFs, docs to extract knowledge.</p>
                  </div>

                  <div 
                    onClick={() => {
                      setActiveNavItem('chat')
                      if (!inspectorOpen) toggleInspector()
                      window.setTimeout(() => document.getElementById('ai-prompt')?.focus(), 0)
                    }}
                    className="group cursor-pointer rounded-xl border border-border bg-surface-0 p-5 transition-all hover:border-primary-300 hover:shadow-md"
                  >
                    <div className="mb-3 inline-flex rounded-lg bg-primary-50 p-2 text-primary-600">
                      <Bot className="h-5 w-5" />
                    </div>
                    <h3 className="font-semibold text-surface-900 group-hover:text-primary-700 transition-colors">Ask AI</h3>
                    <p className="mt-1 text-xs leading-relaxed text-surface-500">Chat with your documents to get answers.</p>
                  </div>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric label="Documents" value={documents.length} detail={`${completed} ready`} icon={FileText} />
                  <Metric label="Ready" value={`${readyRate}%`} detail={`${processing} processing`} icon={Sparkles} />
                  <Metric label="Reports" value={reports.length} detail="stored outputs" icon={FileBarChart2} />
                </div>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-surface-0 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Next step</h2>
              </div>
              <Sparkles className="h-5 w-5 text-ai-500" />
            </div>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {documents.length === 0
                ? 'Upload your first document.'
                : failed > 0
                  ? 'Review failed processing.'
                  : completed >= 2
                    ? 'Compare ready documents.'
                    : 'Open a completed document.'}
            </p>

            <button
              type="button"
              onClick={() => {
                setActiveNavItem('chat')
                if (window.innerWidth < 1280) {
                  useUiStore.getState().setMobileDrawer('inspector')
                  return
                }
                if (!inspectorOpen) toggleInspector()
                window.setTimeout(() => document.getElementById('ai-prompt')?.focus(), 0)
              }}
              className="mt-5 flex w-full items-center justify-between rounded-md border border-ai-100 bg-ai-50 px-3 py-2 text-left text-sm font-medium text-ai-700 transition-colors hover:bg-ai-100"
            >
              Ask AI about this workspace
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="grid min-h-[360px] gap-4 2xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="rounded-lg border border-border bg-surface-0">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Recent documents</h2>
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
                <Button className="mt-4" onClick={() => openUploadModal()}>
                  <Upload className="h-4 w-4" />
                  Upload first document
                </Button>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border bg-surface-0 p-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Workspace health</h2>
            </div>

            <div className="mt-5 space-y-4">
              <HealthRow label="Ready for RAG" value={completed} total={documents.length} />
              <HealthRow label="Still processing" value={processing} total={documents.length} />
              <HealthRow label="Failed processing" value={failed} total={documents.length} tone="danger" />
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

function FileIcon({ type }: { type: string }) {
  const color = getFileTypeColor(type)
  const normalized = type.toLowerCase()
  
  if (normalized === 'pdf') {
    return <FileText className={cn("w-4 h-4 shrink-0", color)} />
  }
  if (normalized === 'docx' || normalized === 'doc') {
    return <File className={cn("w-4 h-4 shrink-0", color)} />
  }
  if (normalized === 'png' || normalized === 'jpg' || normalized === 'jpeg') {
    return <ImageIcon className={cn("w-4 h-4 shrink-0", color)} />
  }
  
  return <FileText className={cn("w-4 h-4 shrink-0", color)} />
}
