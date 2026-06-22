import { useQuery } from '@tanstack/react-query'
import { useParams } from 'react-router-dom'
import { publicApi } from '@/api/publicApi'
import { Loader2, AlertTriangle, FileBarChart2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'

export function PublicReportPage() {
  const { token } = useParams<{ token: string }>()

  const { data: report, isLoading, error } = useQuery({
    queryKey: ['public-report', token],
    queryFn: () => publicApi.getPublicReport(token!),
    enabled: !!token,
    retry: false
  })

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !report) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-surface-50 p-6 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 shadow-sm">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-surface-900">Báo cáo không khả dụng</h1>
        <p className="mt-2 text-surface-500 max-w-md leading-relaxed">
          Liên kết báo cáo này không tồn tại, đã bị xóa hoặc đã hết hạn truy cập.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center justify-between border-b border-border bg-surface-0/80 px-6 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <FileBarChart2 className="h-5 w-5 text-primary-600" />
          <span className="font-semibold text-surface-900">InsightVault AI</span>
          <span className="text-surface-300">/</span>
          <span className="text-sm font-medium text-surface-600">Shared Report</span>
        </div>
        <div className="text-xs text-surface-500">
          Last updated: {new Date(report.updatedAt).toLocaleDateString()}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl py-12 px-6">
          <div className="mb-8 border-b border-border pb-6">
            <h1 className="text-3xl font-bold text-surface-900">{report.title}</h1>
            <div className="mt-2 text-sm text-surface-500 uppercase tracking-wider font-medium">
              {report.reportType.replace(/_/g, ' ')}
            </div>
          </div>
          
          <div className="prose prose-surface max-w-none prose-headings:text-surface-900 prose-a:text-primary-600">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {report.markdownContent}
            </ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  )
}
