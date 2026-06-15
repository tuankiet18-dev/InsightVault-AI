import type { DocumentDto } from '@/types/api-contract'
import { AlertCircle, FileText, Loader2, Sparkles, Tag } from 'lucide-react'
import { useRetryProcessing } from '@/hooks/useDocuments'

export function DocumentSummary({ document }: { document: DocumentDto }) {
  const retryMutation = useRetryProcessing(document.workspaceId)
  const insights = document.insights
  const insightGroups = [
    { id: 'scope', title: 'Scope', items: insights?.scope ?? [] },
    { id: 'decisions', title: 'Decisions', items: insights?.decisions ?? [] },
    { id: 'risks', title: 'Risks', items: insights?.risks ?? [] },
    { id: 'gaps', title: 'Gaps', items: insights?.gaps ?? [] },
    { id: 'next-actions', title: 'Next Actions', items: insights?.nextActions ?? [] },
  ].filter((group) => group.items.length > 0)

  if (document.status === 'processing') {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-surface-500 border border-dashed border-border rounded-xl bg-surface-50/50">
        <div className="w-8 h-8 border-2 border-surface-300 border-t-primary-500 rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-medium text-surface-900 mb-1">AI processing in progress</h3>
        <p className="text-xs max-w-sm">
          Extracting text, generating embeddings, and writing summary. This may take a minute depending on file size.
        </p>
      </div>
    )
  }

  if (document.status === 'failed') {
    return (
      <div className="flex flex-col p-6 border border-danger-200 rounded-xl bg-danger-50">
        <div className="flex items-center gap-2 text-danger-700 font-medium mb-2">
          <AlertCircle className="w-5 h-5" />
          Processing Failed
        </div>
        <p className="text-sm text-danger-600 mb-4">
          {document.processingError || 'An unknown error occurred during AI processing.'}
        </p>
        <button
          onClick={() => retryMutation.mutate(document.id)}
          disabled={retryMutation.isPending}
          className="self-start px-4 py-2 bg-surface-0 text-danger-700 border border-danger-200 rounded-lg text-sm font-medium shadow-sm hover:bg-danger-50 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          {retryMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {retryMutation.isPending ? 'Retrying...' : 'Retry Processing'}
        </button>
      </div>
    )
  }

  if (!document.summary && (!document.keyPoints || document.keyPoints.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-surface-400 border border-dashed border-border rounded-xl">
        <FileText className="w-8 h-8 mb-4 opacity-50" />
        <p className="text-sm">No AI summary available for this document.</p>
      </div>
    )
  }

  return (
    <article className="max-w-none text-[14px] leading-7 text-foreground">
      {document.summary && (
        <section id="ai-summary" className="scroll-mt-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-surface-900 mb-4 border-b border-border pb-2">
            <Sparkles className="w-4 h-4 text-ai-500" /> AI Summary
          </h2>
          {(document.documentType || document.documentTypeConfidence) && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {document.documentType && (
                <span className="inline-flex items-center rounded bg-ai-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-ai-700 border border-ai-100">
                  {formatDocumentType(document.documentType)}
                </span>
              )}
              {typeof document.documentTypeConfidence === 'number' && (
                <span className="text-[11px] text-surface-500">
                  {Math.round(document.documentTypeConfidence * 100)}% confidence
                </span>
              )}
            </div>
          )}
          <p className="text-surface-700 leading-relaxed">{document.summary}</p>
        </section>
      )}

      {document.keyPoints && document.keyPoints.length > 0 && (
        <section id="key-points" className="mt-8 scroll-mt-6">
          <h2 className="text-lg font-bold text-surface-900 mb-4 border-b border-border pb-2">
            Key Findings
          </h2>
          <ul className="space-y-2">
            {document.keyPoints.map((point, i) => (
              <li key={i} className="text-surface-700 pl-2">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-ai-500 mr-2 relative -top-px" />
                {point}
              </li>
            ))}
          </ul>
        </section>
      )}

      {insightGroups.length > 0 && (
        <section id="document-insights" className="mt-8 scroll-mt-6">
          <h2 className="text-lg font-bold text-surface-900 mb-4 border-b border-border pb-2">
            Document Intelligence
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {insightGroups.map((group) => (
              <div key={group.id} className="border border-border rounded-lg p-4 bg-surface-0">
                <h3 className="text-sm font-semibold text-surface-900 mb-2">{group.title}</h3>
                <ul className="space-y-2">
                  {group.items.map((item, i) => (
                    <li key={i} className="text-sm text-surface-700 leading-6">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {document.keywords && document.keywords.length > 0 && (
        <section id="keywords" className="mt-8 scroll-mt-6">
          <h2 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-3">
            Keywords
          </h2>
          <div className="flex flex-wrap gap-2">
            {document.keywords.map((kw, i) => (
              <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-100 text-surface-600 dark:text-surface-300 text-[11px] font-medium border border-surface-200">
                <Tag className="w-3 h-3 text-surface-400 dark:text-surface-500" />
                {kw}
              </span>
            ))}
          </div>
        </section>
      )}
    </article>
  )
}

function formatDocumentType(value: string) {
  return value.replace(/_/g, ' ')
}
