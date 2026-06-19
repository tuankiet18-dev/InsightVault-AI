import { FileText } from 'lucide-react'
import type { ChatMessageDto } from '@/types/api-contract'
import { cn } from '@/lib/utils'
import { useTabStore } from '@/stores/tabStore'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { createDocumentTab } from '@/lib/documentTabs'

export function ChatMessage({ message }: { message: ChatMessageDto }) {
  const isUser = message.role === 'user'
  const { openTab } = useTabStore()

  return (
    <div className={cn('w-full flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-3xl flex gap-3 rounded-2xl border p-4',
        isUser
          ? 'ml-auto w-fit max-w-[82%] border-primary-100 bg-primary-50 text-primary-950'
          : 'w-full border-border bg-surface-0',
      )}>
        {!isUser && (
          <div className="w-8 h-8 rounded-lg bg-ai-100 text-ai-600 flex items-center justify-center shrink-0 mt-1">
            <span className="text-sm font-bold">AI</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          {isUser && (
            <div className="text-xs font-semibold text-primary-600 mb-1 uppercase tracking-wider">You</div>
          )}

          {isUser ? (
            <div className="whitespace-pre-wrap text-sm leading-6 text-primary-950">
              {message.content}
            </div>
          ) : (
            <div className="prose prose-sm prose-slate max-w-none text-surface-900 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}

          {!isUser && message.sources.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {message.sources.map((source, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={!source.documentId}
                  onClick={() => {
                    if (!source.documentId) return
                    openTab(createDocumentTab({
                      documentId: source.documentId,
                      fileName: source.fileName,
                      snippet: source.snippet,
                      documentChunkId: source.documentChunkId,
                      chunkIndex: source.chunkIndex,
                      pageNumber: source.pageNumber,
                    }))
                  }}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-surface-100 border border-border text-xs text-surface-600 hover:bg-surface-200 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
                >
                  <FileText className="w-3 h-3 text-surface-400" />
                  <span className="truncate max-w-[150px]">{source.fileName}</span>
                  <span className="text-surface-400 mx-0.5">/</span>
                  <span className="text-[10px] font-mono text-success-600">{source.similarity?.toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
