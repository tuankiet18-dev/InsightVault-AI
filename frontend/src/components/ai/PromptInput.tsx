import { useAiStore } from '@/stores/aiStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useChatStore } from '@/stores/chatStore'
import { Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { chatApi } from '@/api/chatApi'
import { chatKeys, useChatSessions } from '@/hooks/useChat'
import { useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@/api/http'
import { buildChatContexts } from '@/lib/chatContext'
import { toast } from 'sonner'
import type { ChatMessageDto, ChatSessionDto, ChatSourceDto } from '@/types/api'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Mention from '@tiptap/extension-mention'
import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import { getMentionSuggestion } from '@/components/chat/MentionSuggestion'
import { useState } from 'react'

const MentionHighlightPlugin = Extension.create({
  name: 'mentionHighlight',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('mentionHighlight'),
        state: {
          init() {
            return DecorationSet.empty
          },
          apply(tr) {
            const decorations: Decoration[] = []
            const doc = tr.doc
            doc.descendants((node, pos) => {
              if (node.isText && node.text) {
                const regex = /@[^\s,.;:!?，。،]+(?:\.[^\s,.;:!?，。.,]+)*/g
                let match
                while ((match = regex.exec(node.text)) !== null) {
                  if (match[0].length > 1) {
                    decorations.push(
                      Decoration.inline(pos + match.index, pos + match.index + match[0].length, {
                        class: 'inline-flex max-w-full items-center rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-800 align-baseline shadow-sm',
                      })
                    )
                  }
                }
              }
            })
            return DecorationSet.create(doc, decorations)
          },
        },
        props: {
          decorations(state) {
            return this.getState(state)
          },
        },
      }),
    ]
  },
})

export function PromptInput() {
  const { setAnswer, setCitations, setSuggestions, isLoading, setIsLoading } = useAiStore()
  const { activeWorkspaceId } = useWorkspaceStore()
  const { activeSessionId, setActiveSession, setPendingTurn, setActiveRequestController } = useChatStore()
  const queryClient = useQueryClient()
  const { data: sessions = [] } = useChatSessions(activeWorkspaceId)
  
  const placeholder = 'Ask about the selected document, folder, or workspace...'
  
  const [isEditorEmpty, setIsEditorEmpty] = useState(true)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'inline-flex items-center gap-1 bg-primary-100 text-primary-800 px-2 py-0.5 rounded-full text-[13px] font-semibold select-none shadow-sm border border-primary-300 mx-0.5 whitespace-nowrap ring-1 ring-primary-200/70',
        },
        suggestion: getMentionSuggestion(),
      }),
      MentionHighlightPlugin,
    ],
    content: '',
    onUpdate: ({ editor }) => {
      setIsEditorEmpty(editor.isEmpty)
    },
    editorProps: {
      attributes: {
        id: 'ai-prompt',
        class: 'min-h-[60px] w-full resize-none bg-transparent p-3 text-sm focus:outline-none focus:ring-0 prose prose-sm prose-primary max-w-none leading-normal overflow-y-auto max-h-48',
      },
      handleKeyDown: (_, event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          if (document.querySelector('.tippy-box')) {
            return false
          }
          event.preventDefault()
          handleRun()
          return true
        }
        return false
      },
    },
  })

  const handleRun = async () => {
    if (!editor || isLoading || !activeWorkspaceId) return
    
    const json = editor.getJSON()
    const textContent = editor.getText()
    const mentionedIds: string[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const extractMentions = (node: any) => {
      if (node.type === 'mention' && node.attrs?.id) {
        mentionedIds.push(node.attrs.id)
      }
      if (node.content) {
        node.content.forEach(extractMentions)
      }
    }
    
    if (json.content) {
      json.content.forEach(extractMentions)
    }

    if (!textContent.trim() && mentionedIds.length === 0) return

    setIsLoading(true)
    setAnswer(null)
    setCitations([])
    setSuggestions([])

    const currentPrompt = textContent.trim()
    const optimisticMessageId = `temp-${Date.now()}`
    const assistantMessageId = `temp-assistant-${Date.now()}`
    let targetSessionId: string | null = null
    let persistedUserMessageId: string | null = null
    setPendingTurn({
      workspaceId: activeWorkspaceId,
      sessionId: activeSessionId,
      userContent: currentPrompt,
    })
    const abortController = new AbortController()
    setActiveRequestController(abortController)
    editor.commands.clearContent()

    try {
      let session = sessions.find((candidate) => candidate.id === activeSessionId)

      if (!session) {
        session = await chatApi.createSession(activeWorkspaceId, { title: 'New Chat' })
      }

      targetSessionId = session.id
      setPendingTurn({
        workspaceId: activeWorkspaceId,
        sessionId: session.id,
        userContent: currentPrompt,
      })
      queryClient.setQueryData<ChatSessionDto[]>(chatKeys.sessions(activeWorkspaceId), (oldSessions = []) => [
        session,
        ...oldSessions.filter((candidate) => candidate.id !== session.id),
      ])

      if (session.id !== activeSessionId) {
        setActiveSession(session.id)
      }

      const optimisticMessage: ChatMessageDto = {
        id: optimisticMessageId,
        chatSessionId: session.id,
        role: 'user',
        status: 'pending',
        content: currentPrompt,
        contexts: [],
        sources: [],
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData<ChatMessageDto[]>(chatKeys.messages(session.id), (oldMessages = []) => [
        ...oldMessages,
        optimisticMessage,
      ])

      const stream = chatApi.streamMessage(
        session.id,
        {
          content: currentPrompt,
          contexts: buildChatContexts(mentionedIds),
        },
        abortController.signal,
      )

      let assistantMessage: ChatMessageDto = {
        id: assistantMessageId,
        chatSessionId: session.id,
        role: 'assistant',
        status: 'pending',
        content: '',
        contexts: [],
        sources: [],
        createdAt: new Date().toISOString(),
      }

      queryClient.setQueryData<ChatMessageDto[]>(chatKeys.messages(session.id), (oldMessages = []) => [
        ...oldMessages,
        assistantMessage,
      ])

      let fullContent = ''
      
      for await (const chunk of stream) {
        const eventType = chunk.event || chunk.Event
        const eventData = chunk.data || chunk.Data

        if (eventType === 'user_message') {
          persistedUserMessageId = eventData.id
          // Replace optimistic user message with the real one from DB
          queryClient.setQueryData<ChatMessageDto[]>(chatKeys.messages(session.id), (oldMessages = []) => [
            ...oldMessages.filter((m) => m.id !== optimisticMessageId && m.id !== eventData.id),
            eventData,
            assistantMessage,
          ])
        } else if (eventType === 'sources') {
          const sources = Array.isArray(eventData) ? eventData : []
          assistantMessage = {
            ...assistantMessage,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sources: sources.map((s: Record<string, any>, idx: number) => ({
              id: `temp-source-${idx}`,
              chatMessageId: assistantMessageId,
              documentId: (s.documentId || s.DocumentId || s.document_id) as string | undefined,
              documentChunkId: (s.chunkId || s.ChunkId || s.chunk_id) as string | undefined,
              fileName: (s.fileName || s.FileName || s.file_name || 'Unknown source') as string,
              snippet: (s.snippet || s.Snippet) as string,
              similarity: (s.similarity || s.Similarity) as number | undefined,
              sourceOrder: idx,
              createdAt: new Date().toISOString(),
              chunkIndex: (s.chunkIndex || s.ChunkIndex || s.chunk_index) as number | undefined,
              pageNumber: (s.pageNumber || s.PageNumber || s.page_number) as number | undefined,
            })),
          }
          queryClient.setQueryData<ChatMessageDto[]>(chatKeys.messages(session.id), (oldMessages = []) => [
            ...oldMessages.filter((m) => m.id !== assistantMessageId),
            assistantMessage,
          ])
        } else if (eventType === 'chunk') {
          fullContent += eventData || ''
          assistantMessage = { ...assistantMessage, content: fullContent }
          setAnswer(fullContent)
          queryClient.setQueryData<ChatMessageDto[]>(chatKeys.messages(session.id), (oldMessages = []) => [
            ...oldMessages.filter((m) => m.id !== assistantMessageId),
            assistantMessage,
          ])
        } else if (eventType === 'error') {
          throw new Error(eventData || 'Streaming failed')
        }
      }

      assistantMessage = { ...assistantMessage, status: 'completed' }
      queryClient.setQueryData<ChatMessageDto[]>(chatKeys.messages(session.id), (oldMessages = []) => [
        ...oldMessages.filter((m) => m.id !== assistantMessageId),
        assistantMessage,
      ])

      queryClient.invalidateQueries({ queryKey: chatKeys.sessions(activeWorkspaceId) })
      queryClient.invalidateQueries({ queryKey: chatKeys.messages(session.id) })

      setCitations(assistantMessage.sources
        .filter(hasDocumentSource)
        .map(source => ({
          documentId: source.documentId,
          documentChunkId: source.documentChunkId,
          fileName: source.fileName,
          similarity: source.similarity ?? 0,
          chunkDetail: source.pageNumber
            ? `Page ${source.pageNumber}${source.chunkIndex != null ? ` - chunk ${source.chunkIndex}` : ''}`
            : source.chunkIndex != null
              ? `Chunk ${source.chunkIndex}`
              : source.documentChunkId
                ? `Chunk ${source.documentChunkId.slice(0, 8)}`
                : 'Retrieved source',
          snippet: source.snippet,
          chunkIndex: source.chunkIndex,
          pageNumber: source.pageNumber,
        })))
      setSuggestions(
        assistantMessage.sources.length > 0
          ? ['Open cited source', 'Ask a follow-up in the same workspace chat']
          : ['Try asking about a completed document', 'Open a report or document to narrow the scope']
      )
    } catch (error) {
      if (isAbortError(error)) {
        setAnswer('Request stopped before the AI finished responding.')
        setSuggestions(['Edit your question and send again'])
        if (targetSessionId) {
          queryClient.setQueryData<ChatMessageDto[]>(chatKeys.messages(targetSessionId), (oldMessages = []) =>
            oldMessages
              .filter((message) => message.id !== assistantMessageId)
              .map((message) => {
                if (message.id === optimisticMessageId || message.id === persistedUserMessageId) {
                  return { ...message, status: 'cancelled' as const }
                }
                return message
              }),
          )
          queryClient.invalidateQueries({ queryKey: chatKeys.messages(targetSessionId) })
        }
        return
      }

      const errorMessage = formatChatError(error)
      setAnswer(errorMessage)
      editor.commands.setContent(currentPrompt)
      setSuggestions(['Check that at least one source document is completed', 'Try again after the AI service is ready'])
      toast.error(errorMessage)

      if (targetSessionId) {
        const localErrorMessage: ChatMessageDto = {
          id: `error-${Date.now()}`,
          chatSessionId: targetSessionId,
          role: 'assistant',
          status: 'failed',
          content: errorMessage,
          contexts: [],
          sources: [],
          createdAt: new Date().toISOString(),
        }

        queryClient.setQueryData<ChatMessageDto[]>(chatKeys.messages(targetSessionId), (oldMessages = []) => [
          ...oldMessages
            .filter((message) => message.id !== assistantMessageId)
            .map((message) => (
              message.id === optimisticMessageId || message.id === persistedUserMessageId
                ? { ...message, status: 'failed' as const }
                : message
            )),
          localErrorMessage,
        ])
        queryClient.invalidateQueries({ queryKey: chatKeys.sessions(activeWorkspaceId) })
      }
    } finally {
      setIsLoading(false)
      setPendingTurn(null)
      setActiveRequestController(null)
    }
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!editor) return

    try {
      const dataStr = e.dataTransfer.getData('application/json')
      if (dataStr) {
        const data = JSON.parse(dataStr)
        if ((data.type === 'document' || data.type === 'folder') && data.id) {
          editor.commands.insertContent({
            type: 'mention',
            attrs: {
              id: data.id,
              label: data.name || (data.type === 'folder' ? 'Folder' : 'Document'),
            }
          })
          editor.commands.insertContent(' ')
          editor.commands.focus()
        }
      }
    } catch (err) {
      console.error('Failed to parse drop data', err)
    }
  }

  return (
    <div className="border-t border-border p-2">
      <div 
        className="relative rounded-lg border border-border bg-card focus-within:ring-2 focus-within:ring-ai/40 focus-within:border-transparent transition-all shadow-sm flex items-end min-h-[60px]"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex-1 min-w-0 h-full overflow-hidden">
          <EditorContent editor={editor} />
        </div>
        <button
          onClick={handleRun}
          disabled={isLoading || isEditorEmpty}
          className={cn(
            "absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-md text-sm transition-all shrink-0 z-10",
            isLoading || isEditorEmpty
              ? "bg-primary/40 text-primary-foreground/70 cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          aria-label="Send message"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <Send className="h-4 w-4 ml-0.5" />
          )}
        </button>
      </div>
    </div>
  )
}

function hasDocumentSource(source: ChatSourceDto): source is ChatSourceDto & { documentId: string } {
  return !!source.documentId
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function formatChatError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.errorCode === 'chat.no_completed_documents') {
      return 'No completed documents were found in the selected chat scope. Upload or wait for processing to finish, then ask again.'
    }

    if (error.errorCode === 'chat.ai_failed') {
      return 'The AI service could not answer this question right now. The message was saved, so you can retry in the same workspace chat.'
    }

    return error.message
  }

  return 'Chat failed unexpectedly. Please try again.'
}
