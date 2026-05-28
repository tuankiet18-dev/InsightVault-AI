import { useWorkspaceStore } from '@/stores/workspaceStore'
import { Activity, AlertCircle, Clock } from 'lucide-react'

export function ProcessingQueue() {
  const { getProcessingJobs, getFailedJobs } = useWorkspaceStore()
  const processingJobs = getProcessingJobs()
  const failedJobs = getFailedJobs()
  
  if (processingJobs.length === 0 && failedJobs.length === 0) {
    return null
  }

  return (
    <section className="px-3 py-4 border-t border-border mt-auto bg-surface-0">
      <div className="mb-2 px-2 flex items-center gap-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">
        <Activity className="w-3.5 h-3.5" />
        Background Jobs
      </div>
      <div className="flex flex-col gap-1.5">
        {processingJobs.map(job => (
          <div key={job.id} className="flex items-center justify-between px-2 py-1.5 rounded text-xs bg-warning-50 text-warning-700">
            <div className="flex items-center gap-1.5 truncate">
              <Clock className="w-3.5 h-3.5 shrink-0 animate-pulse" />
              <span className="truncate">{job.jobType.replace('_', ' ')}</span>
            </div>
            <span className="font-mono bg-warning-100 px-1 rounded shrink-0">Processing</span>
          </div>
        ))}
        
        {failedJobs.map(job => (
          <div key={job.id} className="flex flex-col px-2 py-1.5 rounded text-xs bg-danger-50 text-danger-700">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="font-medium truncate">{job.jobType.replace('_', ' ')} failed</span>
            </div>
            <span className="text-danger-600 line-clamp-2 leading-tight" title={job.errorMessage || ''}>
              {job.errorMessage || 'Unknown error'}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
