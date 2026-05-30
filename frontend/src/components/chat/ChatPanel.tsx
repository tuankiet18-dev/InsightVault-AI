import { ChatScopeSelector } from './ChatScopeSelector'
import { ChatCanvas } from './ChatCanvas'
import { ChatHistory } from './ChatHistory'
import { MessageSquare } from 'lucide-react'

export function ChatPanel() {
  return (
    <div className="flex flex-col h-full bg-surface-50">
      <header className="px-6 py-3 border-b border-border bg-surface-0 flex items-center justify-between shrink-0 h-[60px]">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-ai-50 rounded-lg text-ai-600">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-surface-900 leading-tight">Multi-document RAG Chat</h1>
            <p className="text-xs text-surface-500">Ask questions based on your workspace documents.</p>
          </div>
        </div>
        
        <ChatScopeSelector />
      </header>

      <div className="flex flex-1 min-h-0">
        <ChatHistory />
        <ChatCanvas />
        
        {/* Source Inspector Panel (future) */}
        <aside className="w-72 border-border bg-surface-0 flex-col hidden xl:flex shrink-0">
          <div className="px-4 py-3 border-b border-border text-sm font-semibold text-surface-900">
            Source Inspector
          </div>
          <div className="flex-1 flex items-center justify-center p-6 text-center text-surface-400 text-sm">
            Select a citation in the chat to view the full source chunk here.
          </div>
        </aside>
      </div>
    </div>
  )
}
