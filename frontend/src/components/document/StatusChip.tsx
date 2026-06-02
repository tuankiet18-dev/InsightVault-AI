import { cn } from '@/lib/utils'

type StatusChipProps = {
  status?: string
  label?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'ai'
}

export function StatusChip({ status, label, variant }: StatusChipProps) {
  let finalVariant = variant || 'default'
  const finalLabel = label || (status === 'completed' ? 'Ready' : status) || 'Unknown'

  if (!variant && status) {
    switch (status) {
      case 'completed': finalVariant = 'success'; break
      case 'processing': finalVariant = 'warning'; break
      case 'failed': finalVariant = 'danger'; break
      case 'uploaded':
      case 'pending_upload': finalVariant = 'default'; break
    }
  }

  const baseClasses = "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase border"
  
  const variants = {
    default: "bg-surface-100 text-surface-600 border-surface-200",
    success: "bg-success-50 text-success-600 border-success-200",
    warning: "bg-warning-50 text-warning-700 border-warning-200",
    danger: "bg-danger-50 text-danger-700 border-danger-200",
    info: "bg-primary-50 text-primary-600 border-primary-200",
    ai: "bg-ai-50 text-ai-600 border-ai-200",
  }

  return (
    <span className={cn(baseClasses, variants[finalVariant as keyof typeof variants])}>
      {finalVariant === 'warning' && (
        <span className="w-1.5 h-1.5 rounded-full bg-warning-500 mr-1.5 animate-pulse" />
      )}
      {finalLabel.replace('_', ' ')}
    </span>
  )
}
