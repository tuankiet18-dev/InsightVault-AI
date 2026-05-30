import { useAiStore } from '@/stores/aiStore'
import { FileText, ChevronRight } from 'lucide-react'

export function AiAnswer() {
  const { answer, citations, suggestions } = useAiStore()

  if (!answer) return null

  return (
    <div className="mt-6 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <section>
        <h3 className="text-sm font-semibold text-surface-900 mb-2">Answer with sources</h3>
        <div className="text-sm text-surface-700 leading-relaxed bg-surface-0 p-4 rounded-xl border border-border shadow-sm">
          {answer}
        </div>
      </section>

      {citations.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
            Sources
          </h3>
          <div className="flex flex-col gap-2">
            {citations.map((c, i) => (
              <button 
                key={i} 
                className="flex flex-col text-left p-3 rounded-lg border border-border bg-surface-0 hover:border-ai-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-surface-900">
                    <FileText className="w-3.5 h-3.5 text-surface-400 group-hover:text-ai-500 transition-colors" />
                    {c.fileName}
                  </div>
                  <div className="text-[10px] font-mono bg-surface-100 px-1.5 py-0.5 rounded text-surface-500">
                    {c.similarity.toFixed(2)}
                  </div>
                </div>
                <div className="text-xs text-surface-500 mb-1">
                  {c.chunkDetail}
                </div>
                <div className="text-xs text-surface-600 line-clamp-2 italic border-l-2 border-surface-200 pl-2">
                  "{c.snippet}"
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {suggestions.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2">
            Suggested next actions
          </h3>
          <div className="flex flex-col gap-2">
            {suggestions.map((s, i) => (
              <button 
                key={i} 
                className="flex items-center justify-between w-full p-2.5 rounded-lg border border-border bg-surface-0 hover:bg-surface-100 hover:border-surface-300 transition-all text-sm text-surface-700 group text-left"
              >
                <span>{s}</span>
                <ChevronRight className="w-4 h-4 text-surface-400 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
