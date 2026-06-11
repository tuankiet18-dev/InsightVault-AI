import { http, HttpResponse, delay } from 'msw'

import { mockChatSessions, mockChatMessages } from '../data/mockChat'
import type { ChatMessageDto } from '@/types/api'

const API_BASE = 'http://localhost:5126/api'

/**
 * MSW Handlers — DEV only.
 *
 * Only mock endpoints that do NOT have a real backend implementation yet.
 * All other requests use `onUnhandledRequest: 'bypass'` so they hit the real API.
 *
 * Currently mocked (no real BE endpoint):
 *  - Chat sessions & messages
 *
 * NOT mocked (using real backend):
 *  - /auth/*
 *  - /workspaces/*
 *  - /documents/*
 *  - /workspaces/:id/compare
 *  - /workspaces/:id/reports
 *  - /workspaces/:id/ai-jobs
 */
export const handlers = [
  // Chat Sessions
  http.get(`${API_BASE}/workspaces/:workspaceId/chat-sessions`, async () => {
    await delay(300)
    return HttpResponse.json(mockChatSessions)
  }),

  http.get(`${API_BASE}/chat-sessions/:sessionId/messages`, async () => {
    await delay(300)
    return HttpResponse.json(mockChatMessages)
  }),

  http.post(`${API_BASE}/chat-sessions/:sessionId/messages`, async ({ request, params }) => {
    await delay(1000)
    const data = await request.json() as Record<string, unknown>
    const newMsg: ChatMessageDto = {
      id: `msg-${Date.now()}`,
      chatSessionId: params.sessionId as string,
      role: 'user',
      content: (data.content as string) || '',
      contexts: (data.contexts as ChatMessageDto['contexts']) || [],
      sources: [],
      createdAt: new Date().toISOString()
    }
    mockChatMessages.push(newMsg)
    return HttpResponse.json(newMsg)
  }),
]
