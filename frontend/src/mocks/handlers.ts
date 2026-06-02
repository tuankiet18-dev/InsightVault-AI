import { http, HttpResponse, delay } from 'msw'

import { mockJobs } from '../data/mockDocuments'
import { mockReports } from '../data/mockReports'
import { mockCompareResult } from '../data/mockCompare'
import { mockChatSessions, mockChatMessages } from '../data/mockChat'
import { mockAdminStats } from '../data/mockAdmin'
import type { ChatMessageDto } from '@/types/api'

const API_BASE = 'http://localhost:5126/api'

export const handlers = [

  // Documents (Commented out to use Real Backend)
  /*
  http.get(`${API_BASE}/workspaces/:workspaceId/documents`, async ({ params, request }) => {
    // ...
  }),
  http.post(`${API_BASE}/workspaces/:workspaceId/documents/presign-upload`, async ({ request }) => {
    // ...
  }),
  http.post(`${API_BASE}/documents/:documentId/confirm-upload`, async ({ params, request }) => {
    // ...
  }),
  http.get(`${API_BASE}/documents/:documentId`, async ({ params }) => {
    // ...
  }),
  http.delete(`${API_BASE}/documents/:documentId`, async ({ params }) => {
    // ...
  }),
  */

  // Ai Jobs
  http.get(`${API_BASE}/workspaces/:workspaceId/ai-jobs`, async ({ request }) => {
    await delay(300)
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    let jobs = mockJobs
    if (status) {
      jobs = jobs.filter(j => j.status === status)
    }
    return HttpResponse.json(jobs)
  }),

  // Reports
  http.get(`${API_BASE}/workspaces/:workspaceId/reports`, async () => {
    await delay(400)
    return HttpResponse.json(mockReports)
  }),
  http.get(`${API_BASE}/reports/:reportId`, async ({ params }) => {
    await delay(300)
    const report = mockReports.find(r => r.id === params.reportId) || mockReports[0]
    return HttpResponse.json(report)
  }),
  http.post(`${API_BASE}/workspaces/:workspaceId/compare`, async () => {
    await delay(1500)
    return HttpResponse.json(mockCompareResult)
  }),

  // Chat
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
      sources: [],
      createdAt: new Date().toISOString()
    }
    // We add to array to simulate state update
    mockChatMessages.push(newMsg)
    
    return HttpResponse.json(newMsg)
  }),

  // Admin
  http.get(`${API_BASE}/dashboard/me`, async () => {
    await delay(500)
    return HttpResponse.json({
      workspaceCount: mockAdminStats.totalWorkspaces,
      folderCount: 12,
      documentCount: mockAdminStats.totalDocuments,
      completedDocumentCount: mockAdminStats.totalDocuments - 3,
      processingDocumentCount: 2,
      failedDocumentCount: 1,
      reportCount: 5,
      recentJobs: mockJobs
    })
  }),
]
