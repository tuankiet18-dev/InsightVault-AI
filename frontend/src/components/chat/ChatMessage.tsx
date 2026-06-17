import { FileText } from 'lucide-react'
import type { ChatMessageDto } from '@/types/api-contract'
import { cn } from '@/lib/utils'
import { useTabStore } from '@/stores/tabStore'

export function ChatMessage({ message }: { message: ChatMessageDto }) {
  const isUser = message.role === 'user'
  const { openTab } = useTabStore()

  return (
    <div className={cn('w-full flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn(
        'max-w-3xl w-full flex gap-4 p-4 rounded-2xl',
        isUser ? 'bg-primary-50' : 'bg-transparent',
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

          <div className="prose prose-sm prose-slate dark:prose-invert max-w-none text-surface-900 whitespace-pre-wrap">
            {message.content}
          </div>

          {!isUser && message.sources.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {message.sources.map((source, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={!source.documentId}
                  onClick={() => {
                    if (!source.documentId) return
                    openTab({
                      id: `doc-${source.documentId}`,
                      label: source.fileName,
                      type: 'document',
                      documentId: source.documentId,
                      sourceSnippet: source.snippet,
                      sourceChunkId: source.documentChunkId,
                      sourcePageNumber: source.pageNumber,
                      closable: true,
                    })
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

        {isUser && (
          <div className="w-8 h-8 rounded-lg bg-primary-200 text-primary-700 flex items-center justify-center shrink-0 mt-1">
            <span className="text-sm font-bold">M</span>
          </div>
        )}
      </div>
    </div>
  )
}
