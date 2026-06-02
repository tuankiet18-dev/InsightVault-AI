import type { CompareDocumentsResponse } from '@/types/api-contract'
import { CheckCircle2, AlertTriangle, XCircle, Info, ChevronRight } from 'lucide-react'

export function CompareResult({ result }: { result: CompareDocumentsResponse }) {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <section className="bg-surface-0 p-6 rounded-xl border border-border shadow-sm">
        <h3 className="text-sm font-semibold text-surface-500 uppercase tracking-wider mb-2">Objectives & Scope</h3>
        <p className="text-surface-900 mb-4">{result.objectives}</p>
        <div className="p-3 bg-surface-50 border border-border rounded-lg text-sm text-surface-600">
          <strong>Scope:</strong> {result.scope}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResultList 
          title="Similarities / Alignment" 
          items={result.similarities} 
          icon={<CheckCircle2 className="w-5 h-5 text-success-500" />} 
          bgColor="bg-success-50/50"
          borderColor="border-success-200"
        />
        
        <ResultList 
          title="Differences" 
          items={result.differences} 
          icon={<Info className="w-5 h-5 text-primary-500" />} 
          bgColor="bg-primary-50/50"
          borderColor="border-primary-200"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ResultList 
          title="Missing Information / Gaps" 
          items={result.missingInformation} 
          icon={<XCircle className="w-5 h-5 text-danger-500" />} 
          bgColor="bg-danger-50/50"
          borderColor="border-danger-200"
        />
        
        <ResultList 
          title="Potential Conflicts" 
          items={result.potentialConflicts} 
          icon={<AlertTriangle className="w-5 h-5 text-warning-500" />} 
          bgColor="bg-warning-50/50"
          borderColor="border-warning-200"
        />
      </div>

      <section className="bg-ai-50/30 p-6 rounded-xl border border-ai-200 shadow-sm">
        <h3 className="flex items-center gap-2 text-lg font-bold text-ai-900 mb-4">
          <span className="text-ai-500">✨</span> AI Recommendations
        </h3>
        <div className="flex flex-col gap-3">
          {result.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 bg-surface-0 p-4 rounded-lg border border-ai-100 shadow-sm">
              <div className="w-6 h-6 rounded-full bg-ai-100 text-ai-600 flex items-center justify-center shrink-0 font-medium text-xs">
                {i + 1}
              </div>
              <p className="text-sm text-surface-800">{rec}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function ResultList({ 
  title, 
  items, 
  icon,
  bgColor,
  borderColor
}: { 
  title: string
  items: string[]
  icon: React.ReactNode
  bgColor: string
  borderColor: string
}) {
  return (
    <section className={`p-5 rounded-xl border ${borderColor} ${bgColor} flex flex-col h-full`}>
      <h3 className="flex items-center gap-2 text-base font-bold text-surface-900 mb-4">
        {icon}
        {title}
        <span className="ml-auto text-xs font-mono bg-surface-0 px-2 py-0.5 rounded-full border border-surface-200 text-surface-500">
          {items.length}
        </span>
      </h3>
      <ul className="flex flex-col gap-2">
        {items.length === 0 ? (
          <li className="text-sm text-surface-500 italic">No items found.</li>
        ) : (
          items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-surface-800 bg-surface-0 p-3 rounded-lg border border-surface-100 shadow-sm">
              <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-surface-300" />
              <span>{item}</span>
            </li>
          ))
        )}
      </ul>
    </section>
  )
}
