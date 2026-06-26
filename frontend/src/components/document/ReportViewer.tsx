import { useState } from 'react'
import { useTabStore } from '@/stores/tabStore'
import { FileText, Download, Share2, Printer } from 'lucide-react'
import { useReport } from '@/hooks/useReports'
import { useDocuments } from '@/hooks/useDocuments'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { createDocumentTab } from '@/lib/documentTabs'
import { ShareReportModal } from '@/components/report/ShareReportModal'
import { downloadReportMarkdown } from '@/lib/reportDownloads'

export function ReportViewer() {
  const { getActiveTab, openTab } = useTabStore()
  const activeTab = getActiveTab()
  const { activeWorkspaceId } = useWorkspaceStore()
  const [shareOpen, setShareOpen] = useState(false)
  
  const reportId = activeTab?.type === 'report' ? (activeTab.reportId || '1') : null
  const { data: report, isLoading } = useReport(reportId)
  const { data: documents = [] } = useDocuments(activeWorkspaceId)

  const compareDocIds = activeTab?.type === 'report' ? activeTab.compareDocumentIds : undefined
  const compareDocs = compareDocIds ? documents.filter(d => compareDocIds.includes(d.id)) : []
  
  if (!activeTab || activeTab.type !== 'report') return null

  if (isLoading) {
    return <div className="flex-1 p-8 text-surface-500">Loading report...</div>
  }

  if (!report) {
    return <div className="flex-1 p-8 text-surface-500">Report not found.</div>
  }

  const cleanTitle = report.title.replace(/\s*-\s*\d+\s*documents?/i, '')

  const handleExportPdf = () => {
    const printWindow = window.open('', '', 'width=800,height=600')
    if (!printWindow) return

    const reportContent = document.getElementById('report-content')
    if (!reportContent) return

    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('\n')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${cleanTitle}</title>
          ${styles}
          <style>
            body { background-color: white; color: black; }
            .print-toolbar {
              position: sticky;
              top: 0;
              display: flex;
              align-items: center;
              justify-content: space-between;
              gap: 12px;
              padding: 12px 16px;
              margin: -32px -32px 24px;
              border-bottom: 1px solid #e2e8f0;
              background: white;
              font-family: ui-sans-serif, system-ui, sans-serif;
            }
            .print-toolbar button {
              border: 0;
              border-radius: 8px;
              background: #2563eb;
              color: white;
              cursor: pointer;
              font-weight: 600;
              padding: 8px 14px;
            }
            @media print {
              @page { margin: 1cm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .print-toolbar { display: none; }
            }
          </style>
        </head>
        <body class="p-8">
          <div class="print-toolbar">
            <span>Choose "Save as PDF" in the print dialog to export this report.</span>
            <button onclick="window.print()">Save as PDF</button>
          </div>
          <div class="max-w-4xl mx-auto">
            <h1 class="text-3xl font-bold mb-8">${cleanTitle}</h1>
            ${reportContent.innerHTML}
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()

    setTimeout(() => {
      printWindow.print()
    }, 250)
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
              <h1 className="text-xl font-bold text-surface-900 flex items-center flex-wrap gap-1.5">
                {cleanTitle}
                {compareDocs.length > 0 && (
                  <>
                    <span className="text-surface-400 mx-1">:</span>
                    {compareDocs.map((doc, i) => (
                      <span key={doc.id} className="inline-flex items-center">
                        <button
                          onClick={() => openTab(createDocumentTab({ documentId: doc.id, fileName: doc.originalFileName }))}
                          className="text-primary-600 hover:text-primary-700 hover:underline transition-colors text-lg"
                        >
                          {doc.originalFileName}
                        </button>
                        {i < compareDocs.length - 1 && <span className="mx-1.5 text-surface-400 text-lg">vs</span>}
                      </span>
                    ))}
                  </>
                )}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShareOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-surface-600 border border-border hover:bg-surface-100 transition-colors shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={() => downloadReportMarkdown(report)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-surface-600 border border-border hover:bg-surface-100 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
            <button 
              onClick={handleExportPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-surface-0">
        <div className="max-w-4xl mx-auto">
          <article id="report-content" className="prose prose-sm md:prose-base prose-slate dark:prose-invert max-w-none font-sans leading-relaxed text-surface-900">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
              {report.markdownContent}
            </ReactMarkdown>
          </article>
        </div>
      </div>

      {activeWorkspaceId && (
        <ShareReportModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          workspaceId={activeWorkspaceId}
          report={report}
        />
      )}
    </div>
  )
}
