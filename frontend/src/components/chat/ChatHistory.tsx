import { MessageSquare, Plus } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useChatSessions } from '@/hooks/useChat'
import { cn, formatRelativeTime } from '@/lib/utils'

export function ChatHistory() {
  const { activeSessionId, setActiveSession } = useChatStore()
  const { activeWorkspaceId } = useWorkspaceStore()
  const { data: sessions = [] } = useChatSessions(activeWorkspaceId)

  return (
    <aside className="w-64 border-r border-border bg-surface-0 flex flex-col h-full shrink-0">
      <div className="p-3 border-b border-border">
        <button className="flex items-center justify-center gap-2 w-full py-2 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-lg text-sm font-medium transition-colors">
          <Plus className="w-4 h-4" />
          New Chat
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 mb-2 text-xs font-semibold text-surface-500 uppercase tracking-wider">
          Recent Sessions
        </div>
        <div className="flex flex-col px-2 gap-0.5">
          {sessions.map(session => (
            <button
              key={session.id}
              onClick={() => setActiveSession(session.id)}
              className={cn(
                "flex items-start gap-2 w-full p-2 rounded-lg text-left transition-colors group",
                activeSessionId === session.id 
                  ? "bg-surface-100" 
                  : "hover:bg-surface-50"
              )}
            >
              <MessageSquare className={cn(
                "w-4 h-4 mt-0.5 shrink-0 transition-colors",
                activeSessionId === session.id ? "text-primary-500" : "text-surface-400 group-hover:text-surface-600"
              )} />
              <div className="flex-1 min-w-0">
                <div className={cn(
                  "text-sm truncate font-medium",
                  activeSessionId === session.id ? "text-surface-900" : "text-surface-700 group-hover:text-surface-900"
                )}>
                  {session.title || 'New Chat'}
                </div>
                <div className="text-[11px] text-surface-400 mt-0.5">
                  {formatRelativeTime(session.updatedAt)}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
