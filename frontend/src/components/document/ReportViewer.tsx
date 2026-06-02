import { useTabStore } from '@/stores/tabStore'
import { FileText, Download, Share2 } from 'lucide-react'
import { useReport } from '@/hooks/useReports'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export function ReportViewer() {
  const { getActiveTab } = useTabStore()
  const activeTab = getActiveTab()
  
  const reportId = activeTab?.type === 'report' ? (activeTab.reportId || '1') : null
  const { data: report, isLoading } = useReport(reportId)

  if (!activeTab || activeTab.type !== 'report') return null

  if (isLoading) {
    return <div className="flex-1 p-8 text-surface-500">Loading report...</div>
  }

  if (!report) {
    return <div className="flex-1 p-8 text-surface-500">Report not found.</div>
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-surface-50">
      <header className="px-6 py-4 border-b border-border bg-surface-0 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-medium text-surface-400 uppercase tracking-wider mb-0.5">
                AI Generated Report
              </div>
              <h1 className="text-xl font-bold text-surface-900">{report.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-surface-600 border border-border hover:bg-surface-100 transition-colors shadow-sm">
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto bg-surface-0 p-8 md:p-12 rounded-2xl shadow-sm border border-border">
          <article className="prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.markdownContent}</ReactMarkdown>
          </article>
        </div>
      </div>
    </div>
  )
}
