import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/adminApi'
import { AlertCircle, Clock, CheckCircle2, Ban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatRelativeTime } from '@/lib/utils'
import type { AiJobStatus, AiJobType } from '@/types/api'

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

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['admin', 'ai-jobs', status, jobType],
    queryFn: () => adminApi.getAllAiJobs(status, jobType),
  })

  return (
    <main className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">AI Jobs</h1>
        <span className="text-sm text-muted-foreground">{jobs.length} jobs</span>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex gap-1.5 flex-wrap">
          {ALL_STATUSES.map(opt => (
            <Button
              key={String(opt.value)}
              variant={status === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setStatus(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {ALL_TYPES.map(opt => (
            <Button
              key={String(opt.value)}
              variant={jobType === opt.value ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setJobType(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Job ID</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Type</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Error</th>
              <th className="px-4 py-3 font-semibold text-muted-foreground">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Loading...
                </td>
              </tr>
            ) : jobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No jobs found
                </td>
              </tr>
            ) : (
              jobs.map(job => (
                <tr
                  key={job.id}
                  className={`transition-colors ${
                    job.status === 'failed'
                      ? 'bg-red-50/40 hover:bg-red-50/60'
                      : 'hover:bg-muted/30'
                  }`}
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {job.id.substring(0, 8)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {job.jobType.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3">
                    <JobStatusBadge status={job.status} />
                  </td>
                  <td className="px-4 py-3 text-xs text-red-600 max-w-[200px] truncate">
                    {job.errorMessage ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {formatRelativeTime(job.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}

function JobStatusBadge({ status }: { status: AiJobStatus }) {
  const config = {
    processing: {
      cls: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      icon: <Clock className="w-3 h-3 animate-pulse" />,
      label: 'Processing',
    },
    queued: {
      cls: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: <Clock className="w-3 h-3" />,
      label: 'Queued',
    },
    completed: {
      cls: 'bg-green-50 text-green-700 border-green-200',
      icon: <CheckCircle2 className="w-3 h-3" />,
      label: 'Completed',
    },
    failed: {
      cls: 'bg-red-50 text-red-700 border-red-200',
      icon: <AlertCircle className="w-3 h-3" />,
      label: 'Failed',
    },
    cancelled: {
      cls: 'bg-gray-100 text-gray-600 border-gray-200',
      icon: <Ban className="w-3 h-3" />,
      label: 'Cancelled',
    },
  }
  const c = config[status] ?? config.cancelled
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border ${c.cls}`}>
      {c.icon} {c.label}
    </span>
  )
}