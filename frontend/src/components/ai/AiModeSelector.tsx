import { useAiStore } from '@/stores/aiStore'
import { AI_MODES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function AiModeSelector() {
  const { mode, setMode } = useAiStore()

  return (
    <div className="flex bg-surface-100 p-1 rounded-lg w-full">
      {AI_MODES.map(m => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className={cn(
            "flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all",
            mode === m 
              ? "bg-surface-0 text-surface-900 shadow-sm" 
              : "text-surface-500 hover:text-surface-900"
          )}
        >
          {m}
        </button>
      ))}
    </div>
  )
}
