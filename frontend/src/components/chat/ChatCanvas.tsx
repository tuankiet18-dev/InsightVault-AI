import { useEffect, useRef } from 'react'
import { useChatStore } from '@/stores/chatStore'
import { useChatMessages, useSendMessage } from '@/hooks/useChat'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'

export function ChatCanvas() {
  const { activeSessionId } = useChatStore()
  const { data: messages = [] } = useChatMessages(activeSessionId)
  const isLoading = useSendMessage(activeSessionId || '').isPending
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, isLoading])

  return (
    <div className="flex-1 flex flex-col h-full bg-surface-50 border-r border-border min-w-0">
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 scroll-smooth"
      >
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-3xl w-full flex gap-4 p-4">
              <div className="w-8 h-8 rounded-lg bg-ai-100 text-ai-600 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold">AI</span>
              </div>
              <div className="flex items-center gap-1.5 h-8">
                <div className="w-2 h-2 rounded-full bg-ai-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-ai-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-ai-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
      
      <ChatInput />
    </div>
  )
}
