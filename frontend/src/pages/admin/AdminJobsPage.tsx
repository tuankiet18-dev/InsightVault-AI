import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { adminApi } from '@/api/adminApi'
import { AlertCircle, Ban, CheckCircle2, Clock, RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import type { AiJobDto, AiJobStatus, AiJobType } from '@/types/api'

const ALL_STATUSES: { label: string; value: AiJobStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Processing', value: 'processing' },
  { label: 'Queued', value: 'queued' },
  { label: 'Completed', value: 'completed' },
  { label: 'Failed', value: 'failed' },
  { label: 'Cancelled', value: 'cancelled' },
]

const ALL_TYPES: { label: string; value: AiJobType | undefined }[] = [
  { label: 'All Types', value: undefined },
  { label: 'Process Doc', value: 'process_document' },
  { label: 'Summary', value: 'generate_summary' },
  { label: 'RAG Chat', value: 'rag_chat' },
  { label: 'Report', value: 'generate_report' },
  { label: 'Compare', value: 'compare_documents' },
]

export function AdminJobsPage() {
  const [status, setStatus] = useState<AiJobStatus | undefined>(undefined)
  const [jobType, setJobType] = useState<AiJobType | undefined>(undefined)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['admin', 'ai-jobs', status, jobType],
    queryFn: () => adminApi.getAllAiJobs(status, jobType),
  })
  const detailQuery = useQuery({
    queryKey: ['admin', 'ai-jobs', selectedJobId],
    queryFn: () => adminApi.getAiJobDetail(selectedJobId!),
    enabled: !!selectedJobId,
  })

  const retryMutation = useMutation({
    mutationFn: (jobId: string) => adminApi.retryAiJob(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-jobs', jobId] })
    },
  })
  const cancelMutation = useMutation({
    mutationFn: (jobId: string) => adminApi.cancelAiJob(jobId),
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-jobs'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'ai-jobs', jobId] })
    },
  })

  return (
    <main className="mx-auto grid max-w-7xl gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:p-8">
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">AI Jobs</h1>
          <span className="text-sm text-muted-foreground">{jobs.length} jobs</span>
        </div>

        <div className="flex flex-wrap gap-4">
          <FilterGroup items={ALL_STATUSES} value={status} onChange={setStatus} />
          <FilterGroup items={ALL_TYPES} value={jobType} onChange={setJobType} secondary />
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Job ID</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Type</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Retry</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Created</th>
                <th className="px-4 py-3 font-semibold text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <EmptyRow colSpan={6} label="Loading..." />
              ) : jobs.length === 0 ? (
                <EmptyRow colSpan={6} label="No jobs found" />
              ) : (
                jobs.map(job => (
                  <JobRow
                    key={job.id}
                    job={job}
                    selected={selectedJobId === job.id}
                    onSelect={() => setSelectedJobId(job.id)}
                    onRetry={() => retryMutation.mutate(job.id)}
                    onCancel={() => cancelMutation.mutate(job.id)}
                    isMutating={retryMutation.isPending || cancelMutation.isPending}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="max-h-[calc(100dvh-120px)] overflow-y-auto rounded-xl border border-border bg-card p-5 shadow-sm">
        {!selectedJobId ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <Clock className="mb-3 h-8 w-8" />
            Select a job to inspect payload and full error details.
          </div>
        ) : detailQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading detail...</div>
        ) : detailQuery.data ? (
          <div className="space-y-5">
            <div>
              <h2 className="font-semibold">Job {detailQuery.data.job.id.slice(0, 8)}</h2>
              <p className="text-xs text-muted-foreground">{detailQuery.data.createdByEmail ?? 'system job'}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <JobStatusBadge status={detailQuery.data.job.status} />
              <span className="rounded border border-border px-2 py-0.5 text-xs">
                {detailQuery.data.job.jobType.replace(/_/g, ' ')}
              </span>
            </div>
            <JsonBlock title="Input Payload" value={detailQuery.data.inputPayload} />
            <JsonBlock title="Output Payload" value={detailQuery.data.outputPayload} />
            <JsonBlock title="Error / Stack Trace" value={detailQuery.data.errorMessage ?? 'No error'} danger />
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Job detail unavailable.</div>
        )}
      </aside>
    </main>
  )
}

function JobRow({
  job,
  selected,
  onSelect,
  onRetry,
  onCancel,
  isMutating,
}: {
  job: AiJobDto
  selected: boolean
  onSelect: () => void
  onRetry: () => void
  onCancel: () => void
  isMutating: boolean
}) {
  return (
    <tr className={selected ? 'bg-muted/50' : job.status === 'failed' ? 'bg-red-50/40 hover:bg-red-50/60' : 'hover:bg-muted/30'}>
      <td className="px-4 py-3">
        <button type="button" onClick={onSelect} className="font-mono text-xs text-muted-foreground">
          {job.id.substring(0, 8)}
        </button>
      </td>
      <td className="px-4 py-3 font-medium">{job.jobType.replace(/_/g, ' ')}</td>
      <td className="px-4 py-3"><JobStatusBadge status={job.status} /></td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{job.retryCount}</td>
      <td className="px-4 py-3 text-xs text-muted-foreground">{formatRelativeTime(job.createdAt)}</td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={onSelect}>Detail</Button>
          {job.status === 'failed' && (
            <Button variant="ghost" size="sm" disabled={isMutating} onClick={onRetry}>
              <RefreshCcw className="h-3.5 w-3.5" />
              Retry
            </Button>
          )}
          {(job.status === 'queued' || job.status === 'processing') && (
            <Button variant="destructive" size="sm" disabled={isMutating} onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}

function JobStatusBadge({ status }: { status: AiJobStatus }) {
  const config = {
    processing: { cls: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: <Clock className="h-3 w-3 animate-pulse" />, label: 'Processing' },
    queued: { cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Clock className="h-3 w-3" />, label: 'Queued' },
    completed: { cls: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle2 className="h-3 w-3" />, label: 'Completed' },
    failed: { cls: 'bg-red-50 text-red-700 border-red-200', icon: <AlertCircle className="h-3 w-3" />, label: 'Failed' },
    cancelled: { cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: <Ban className="h-3 w-3" />, label: 'Cancelled' },
  }
  const c = config[status] ?? config.cancelled
  return <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-medium ${c.cls}`}>{c.icon} {c.label}</span>
}

function FilterGroup<T extends string>({
  items,
  value,
  onChange,
  secondary = false,
}: {
  items: { label: string; value: T | undefined }[]
  value: T | undefined
  onChange: (value: T | undefined) => void
  secondary?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(opt => (
        <Button
          key={String(opt.value)}
          variant={value === opt.value ? (secondary ? 'secondary' : 'default') : 'outline'}
          size="sm"
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  )
}

function JsonBlock({ title, value, danger = false }: { title: string; value: string; danger?: boolean }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <pre className={danger
        ? 'max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800'
        : 'max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/40 p-3 text-xs text-foreground'
      }>
        {formatJson(value)}
      </pre>
    </section>
  )
}

function formatJson(value: string) {
  try {
    return JSON.stringify(JSON.parse(value), null, 2)
  } catch {
    return value
  }
}

function EmptyRow({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-muted-foreground">
        {label}
      </td>
    </tr>
  )
}
