import { SendHorizontal, Sparkles } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { useSendMessage } from '@/hooks/useChat'

export function ChatInput() {
  const { inputValue, setInputValue, activeSessionId } = useChatStore()
  const sendMessageMutation = useSendMessage(activeSessionId || '')
  const isLoading = sendMessageMutation.isPending

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (inputValue.trim() && !isLoading && activeSessionId) {
        sendMessageMutation.mutate({ content: inputValue })
        setInputValue('')
      }
    }
  }

  const handleSend = () => {
    if (inputValue.trim() && !isLoading && activeSessionId) {
      sendMessageMutation.mutate({ content: inputValue })
      setInputValue('')
    }
  }

  return (
    <div className="p-4 bg-surface-0 border-t border-border">
      <div className="max-w-3xl mx-auto relative flex items-end gap-2 bg-surface-50 border border-border rounded-xl p-2 focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:border-primary-500 transition-all shadow-sm">
        <div className="p-2 text-primary-500 shrink-0 self-end mb-1">
          <Sparkles className="w-5 h-5" />
        </div>
        
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about your documents..."
          className="flex-1 bg-transparent resize-none max-h-48 min-h-[44px] py-3 text-sm focus:outline-none placeholder:text-surface-400"
          rows={1}
        />
        
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isLoading}
          className="p-2.5 rounded-lg bg-primary-500 text-white shrink-0 self-end mb-0.5 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <SendHorizontal className="w-5 h-5" />
          )}
        </button>
      </div>
      <div className="max-w-3xl mx-auto mt-2 text-center text-xs text-surface-400">
        AI responses are based on the documents in your selected scope. Verify critical information.
      </div>
    </div>
  )
}
