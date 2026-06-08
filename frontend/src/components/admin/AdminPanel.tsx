import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useAiJobs } from '@/hooks/useAiJobs'
import { Clock, CheckCircle2, AlertCircle, HardDrive, Users, FileText, Database } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/api/adminApi'

export function AdminPanel() {
  const { activeWorkspaceId } = useWorkspaceStore()
  const { data: jobs = [] } = useAiJobs(activeWorkspaceId)
  const processingJobs = jobs.filter(j => j.status === 'processing')
  const failedJobs = jobs.filter(j => j.status === 'failed')

  const { data: dashboard } = useQuery({
    queryKey: ['admin', 'dashboard'],
    queryFn: () => adminApi.getDashboard(),
  })
  const { data: users = [] } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminApi.getUsers(),
  })
  return (
    <div className="flex flex-col h-full bg-surface-50 overflow-y-auto p-6 lg:p-8">
      <div className="max-w-6xl mx-auto w-full space-y-8">

        {/* Metrics Grid */}
        <section>
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-4">System Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Active Workspaces"
              value={dashboard?.workspaceCount?.toString() || '0'}
              icon={<Database className="w-5 h-5 text-primary-500" />}
              trend="Current active"
            />
            <MetricCard
              title="Total Documents"
              value={dashboard?.documentCount?.toString() || '0'}
              icon={<FileText className="w-5 h-5 text-ai-500" />}
              trend="All workspaces"
            />
            <MetricCard
              title="Total Reports"
              value={dashboard?.reportCount?.toString() || '0'}
              icon={<HardDrive className="w-5 h-5 text-surface-500" />}
              trend="Generated"
            />
            <MetricCard
              title="Completed Docs"
              value={dashboard?.completedDocumentCount?.toString() || '0'}
              icon={<Users className="w-5 h-5 text-success-500" />}
              trend="Ready for RAG"
            />
            <MetricCard
              title="Total Users"
              value={users.length.toString()}
              icon={<Users className="w-5 h-5 text-primary-500" />}
              trend="Registered"
            />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Jobs Queue */}
          <section className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wider">Background Jobs</h2>
              <span className="text-xs font-medium bg-warning-100 text-warning-700 px-2 py-0.5 rounded-full">
                {processingJobs.length} active
              </span>
            </div>

            <div className="bg-surface-0 border border-border rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-50 border-b border-border text-xs uppercase text-surface-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Job ID</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Started</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {jobs.slice(0, 8).map(job => (
                    <tr key={job.id} className="hover:bg-surface-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-surface-500">{job.id.substring(0, 8)}</td>
                      <td className="px-4 py-3 font-medium text-surface-900">{job.jobType.replace(/_/g, ' ')}</td>
                      <td className="px-4 py-3">
                        <JobStatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-3 text-surface-500">{formatRelativeTime(job.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* System Health */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wider">System Health</h2>

            <div className="bg-surface-0 border border-border rounded-xl shadow-sm p-5 space-y-6">
              <HealthMetric
                label="AI Embedding Service"
                status="healthy"
                value="99.9% uptime"
              />
              <HealthMetric
                label="Vector Database"
                status="healthy"
                value="45ms avg latency"
              />
              <HealthMetric
                label="Document Processor"
                status={failedJobs.length > 0 ? "warning" : "healthy"}
                value={`${failedJobs.length} errors in last hour`}
              />

              <div className="pt-4 border-t border-border">
                <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-3">AI Credits Usage</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-surface-600">Gemini 1.5 Pro</span>
                    <span className="font-medium">45k / 100k reqs</span>
                  </div>
                  <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div className="h-full bg-ai-500 rounded-full w-[45%]" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

      </div>
    </div>
  )
}

function MetricCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="bg-surface-0 p-5 rounded-xl border border-border shadow-sm flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-surface-600">{title}</h3>
        {icon}
      </div>
      <div className="text-2xl font-bold text-surface-900 mb-1">{value}</div>
      {trend && <div className="text-xs text-surface-500 mt-auto">{trend}</div>}
    </div>
  )
}

function JobStatusBadge({ status }: { status: string }) {
  if (status === 'processing') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-warning-50 text-warning-700 border border-warning-200">
      <Clock className="w-3 h-3 animate-pulse" /> Processing
    </span>
  )
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-success-50 text-success-700 border border-success-200">
      <CheckCircle2 className="w-3 h-3" /> Completed
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-danger-50 text-danger-700 border border-danger-200">
      <AlertCircle className="w-3 h-3" /> Failed
    </span>
  )
}

function HealthMetric({ label, status, value }: { label: string, status: 'healthy' | 'warning' | 'error', value: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className={`w-2 h-2 rounded-full ${status === 'healthy' ? 'bg-success-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' :
          status === 'warning' ? 'bg-warning-500 shadow-[0_0_8px_rgba(234,179,8,0.4)] animate-pulse' :
            'bg-danger-500'
          }`} />
        <span className="text-sm font-medium text-surface-700">{label}</span>
      </div>
      <span className="text-xs text-surface-500">{value}</span>
    </div>
  )
}
