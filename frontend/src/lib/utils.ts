import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '…'
}

export function getFileTypeColor(fileType: string): string {
  switch (fileType.toLowerCase()) {
    case 'pdf': return 'text-danger-500'
    case 'docx': case 'doc': return 'text-primary-500'
    case 'md': case 'markdown': return 'text-ai-500'
    case 'txt': return 'text-surface-500'
    default: return 'text-surface-400'
  }
}

export function getStatusColor(status: string): { bg: string; text: string; dot: string } {
  switch (status) {
    case 'completed':
      return { bg: 'bg-success-50', text: 'text-success-600', dot: 'bg-success-500' }
    case 'processing':
      return { bg: 'bg-warning-50', text: 'text-warning-600', dot: 'bg-warning-500' }
    case 'failed':
      return { bg: 'bg-danger-50', text: 'text-danger-600', dot: 'bg-danger-500' }
    case 'uploaded':
    case 'pending_upload':
      return { bg: 'bg-surface-100', text: 'text-surface-600', dot: 'bg-surface-400' }
    case 'queued':
      return { bg: 'bg-primary-50', text: 'text-primary-600', dot: 'bg-primary-500' }
    default:
      return { bg: 'bg-surface-100', text: 'text-surface-600', dot: 'bg-surface-400' }
  }
}

export const FILE_TYPES_ACCEPTED = ['.pdf', '.doc', '.docx', '.txt', '.md', '.markdown']
export const MAX_FILE_SIZE_MB = 100
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
