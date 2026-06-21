import { PromptInput } from './PromptInput'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useAiStore } from '@/stores/aiStore'
import { useChatStore } from '@/stores/chatStore'
import { useChatMessages, useChatSessions, useCreateChatSession } from '@/hooks/useChat'
import { ChatMessage } from '@/components/chat/ChatMessage'
import { Sparkles, Plus, History, MessageSquare, MoreHorizontal, Pin, PinOff, Edit2, Trash2, Check, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { DropdownMenu } from '@/components/ui/DropdownMenu'
import { formatRelativeTime, cn } from '@/lib/utils'
import type { ChatSessionDto } from '@/types/api'
import { useUpdateChatSession, useDeleteChatSession } from '@/hooks/useChat'

export function AiInspector() {
  const { activeWorkspaceId } = useWorkspaceStore()
  if (!activeWorkspaceId) return null

  return (
    <div className="flex h-full min-h-0 flex-col bg-card">
      <header className="shrink-0 border-b border-border px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-xs font-semibold text-foreground">
            <Sparkles className="h-4 w-4 text-ai-500" />
            AI Assistant
          </h2>
          <div className="flex items-center gap-1">
            <ChatHistoryDropdown workspaceId={activeWorkspaceId} />
            <NewChatButton workspaceId={activeWorkspaceId} />
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3">
          <InspectorChatTranscript workspaceId={activeWorkspaceId} />
        </div>
        <PromptInput />
      </div>
    </div>
  )
}

function NewChatButton({ workspaceId }: { workspaceId: string }) {
  const { setActiveSession } = useChatStore()
  const createSession = useCreateChatSession(workspaceId)

  const handleNewChat = () => {
    createSession.mutate(
      { title: 'New Chat' },
      {
        onSuccess: (newSession) => {
          setActiveSession(newSession.id)
        }
      }
    )
  }

  return (
    <button
      onClick={handleNewChat}
      disabled={createSession.isPending}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 transition-colors disabled:opacity-50 shrink-0 border border-primary-100"
      title="New Chat"
    >
      <Plus className="h-3 w-3" />
      <span>New Chat</span>
    </button>
  )
}

function ChatHistoryDropdown({ workspaceId }: { workspaceId: string }) {
  const { data: sessions = [] } = useChatSessions(workspaceId)
  
  const pinnedSessions = sessions.filter(s => s.isPinned)
  const recentSessions = sessions.filter(s => !s.isPinned)

  return (
    <DropdownMenu
      trigger={
        <button
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted transition-colors shrink-0 border border-border bg-background"
          title="Chat History"
        >
          <History className="h-3 w-3" />
          <span>History</span>
        </button>
      }
    >
      <div className="max-h-[400px] overflow-y-auto min-w-[240px] p-1">
        {sessions.length === 0 ? (
          <div className="px-3 py-2 text-xs text-muted-foreground">No recent chats</div>
        ) : (
          <div className="flex flex-col gap-2">
            {pinnedSessions.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Pinned</div>
                {pinnedSessions.map(session => (
                  <ChatHistoryItem key={session.id} session={session} workspaceId={workspaceId} />
                ))}
              </div>
            )}
            
            {recentSessions.length > 0 && (
              <div>
                <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Recent</div>
                {recentSessions.map(session => (
                  <ChatHistoryItem key={session.id} session={session} workspaceId={workspaceId} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </DropdownMenu>
  )
}

function ChatHistoryItem({ session, workspaceId }: { session: ChatSessionDto, workspaceId: string }) {
  const { activeSessionId, setActiveSession } = useChatStore()
  const updateSession = useUpdateChatSession(workspaceId)
  const deleteSession = useDeleteChatSession(workspaceId)
  
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(session.title || '')
  const [showActions, setShowActions] = useState(false)
  
  const isActive = activeSessionId === session.id

  const handleSelect = () => {
    if (isEditing) return
    setActiveSession(session.id)
  }

  const handleTogglePin = (e: React.MouseEvent) => {
    e.stopPropagation()
    updateSession.mutate({ sessionId: session.id, data: { isPinned: !session.isPinned } })
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this chat session?')) {
      deleteSession.mutate(session.id)
    }
  }

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
    setShowActions(false)
  }

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (editTitle.trim() && editTitle !== session.title) {
      updateSession.mutate({ sessionId: session.id, data: { title: editTitle } })
    }
    setIsEditing(false)
  }

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditTitle(session.title || '')
    setIsEditing(false)
  }

  return (
    <div 
      className={cn(
        "group relative flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-surface-100",
        isActive ? "bg-primary-50" : ""
      )}
      onClick={handleSelect}
    >
      <MessageSquare className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary-500" : "text-muted-foreground")} />
      
      <div className="flex flex-col min-w-0 flex-1">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              className="text-xs w-full bg-background border border-border rounded px-1 py-0.5 outline-none focus:border-primary"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter') handleSaveEdit(e as any)
                if (e.key === 'Escape') handleCancelEdit(e as any)
              }}
              onClick={e => e.stopPropagation()}
            />
            <button onClick={handleSaveEdit} className="p-0.5 text-green-600 hover:bg-green-50 rounded"><Check className="h-3 w-3" /></button>
            <button onClick={handleCancelEdit} className="p-0.5 text-red-600 hover:bg-red-50 rounded"><X className="h-3 w-3" /></button>
          </div>
        ) : (
          <>
            <span className={cn("text-xs truncate", isActive ? 'font-semibold text-primary-700' : 'text-surface-700')}>
              {session.title || 'New Chat'}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {formatRelativeTime(session.updatedAt)}
            </span>
          </>
        )}
      </div>

      {!isEditing && (
        <div className="shrink-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          {showActions ? (
            <div className="flex items-center gap-1 bg-surface-100 pl-1">
              <button 
                onClick={handleTogglePin}
                className="p-1 rounded hover:bg-surface-200 text-muted-foreground hover:text-foreground"
                title={session.isPinned ? "Unpin" : "Pin"}
              >
                {session.isPinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
              </button>
              <button 
                onClick={handleStartEdit}
                className="p-1 rounded hover:bg-surface-200 text-muted-foreground hover:text-foreground"
                title="Rename"
              >
                <Edit2 className="h-3 w-3" />
              </button>
              <button 
                onClick={handleDelete}
                className="p-1 rounded hover:bg-danger-50 text-muted-foreground hover:text-danger-600"
                title="Delete"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button 
              onClick={(e) => { e.stopPropagation(); setShowActions(true) }}
              className="p-1 rounded hover:bg-surface-200 text-muted-foreground"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function InspectorChatTranscript({ workspaceId }: { workspaceId: string }) {
  const { activeSessionId, setActiveSession } = useChatStore()
  const { isLoading } = useAiStore()
  const { data: sessions = [] } = useChatSessions(workspaceId)
  
  // Attempt to select the most recent session if none is active
  useEffect(() => {
    if (!activeSessionId && sessions.length > 0) {
      setActiveSession(sessions[0].id)
    }
  }, [activeSessionId, sessions, setActiveSession])

  const sessionId = activeSessionId
  const { data: messages = [] } = useChatMessages(sessionId)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length, isLoading])

  if (!sessionId || messages.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center text-center text-surface-500">
        <Sparkles className="h-8 w-8 text-surface-300 mb-3" />
        <p className="text-sm">Welcome to your Workspace AI Assistant.</p>
        <p className="text-xs mt-1">Start typing below to search across your workspace.<br/>Use <strong>@</strong> to mention specific documents.</p>
      </div>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="space-y-3">
        {messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="w-full flex justify-start">
            <div className="w-full max-w-3xl border border-border bg-slate-50/50 dark:bg-slate-900/50 flex gap-3 rounded-xl p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                  AI is thinking...
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>
    </div>
  )
}
