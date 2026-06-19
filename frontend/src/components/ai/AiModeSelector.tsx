import { useAiStore } from '@/stores/aiStore'
import { AI_MODES } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function AiModeSelector() {
  const { mode, setMode, setAnswer, setCitations, setSuggestions } = useAiStore()

  return (
    <div className="m-2 grid grid-cols-3 rounded-lg bg-muted p-1">
      {AI_MODES.map(m => (
        <button
          onClick={() => {
            if (m !== mode) {
              setMode(m)
              setAnswer(null)
              setCitations([])
              setSuggestions([])
            }
          }}
          className={cn(
            "py-1.5 px-3 text-xs font-medium rounded-md transition-all",
            mode === m 
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
            m === 'Gap' && 'hidden'
          )}
        >
          {m}
        </button>
      ))}
    </div>
  )
}
