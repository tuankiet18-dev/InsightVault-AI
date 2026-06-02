import { http, HttpResponse, delay } from 'msw'
import { mockWorkspaces, mockFolders } from '../data/mockWorkspaces'
import { mockDocuments, mockJobs } from '../data/mockDocuments'
import { mockReports } from '../data/mockReports'
import { mockCompareResult } from '../data/mockCompare'
import { mockChatSessions, mockChatMessages } from '../data/mockChat'
import { mockAdminStats } from '../data/mockAdmin'
import type { ChatMessageDto, WorkspaceDto, FolderDto, DocumentDto } from '@/types/api'

const API_BASE = 'http://localhost:5126/api'

export const handlers = [
  // Workspaces
  http.get(`${API_BASE}/workspaces`, async () => {
    await delay(500)
    return HttpResponse.json(mockWorkspaces)
  }),
  http.get(`${API_BASE}/workspaces/:workspaceId`, async ({ params }) => {
    await delay(300)
    const ws = mockWorkspaces.find(w => w.id === params.workspaceId)
    return ws ? HttpResponse.json(ws) : new HttpResponse(null, { status: 404 })
  }),
  http.post(`${API_BASE}/workspaces`, async ({ request }) => {
    await delay(1000)
    const data = await request.json() as Record<string, unknown>
    const newWs: WorkspaceDto = {
      id: `ws-${Date.now()}`,
      ownerId: 'mock-user-1',
      name: data.name as string,
      description: (data.description as string) || '',
      isArchived: false,
      currentUserRole: 'owner',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockWorkspaces.push(newWs)
    return HttpResponse.json(newWs)
  }),
  http.patch(`${API_BASE}/workspaces/:workspaceId`, async ({ params, request }) => {
    await delay(500)
    const data = await request.json() as Record<string, unknown>
    const index = mockWorkspaces.findIndex(w => w.id === params.workspaceId)
    if (index !== -1) {
      mockWorkspaces[index] = { ...mockWorkspaces[index], ...data }
      return HttpResponse.json(mockWorkspaces[index])
    }
    return new HttpResponse(null, { status: 404 })
  }),
  http.delete(`${API_BASE}/workspaces/:workspaceId`, async ({ params }) => {
    await delay(500)
    const index = mockWorkspaces.findIndex(w => w.id === params.workspaceId)
    if (index !== -1) {
      mockWorkspaces.splice(index, 1)
      return new HttpResponse(null, { status: 204 })
    }
    return new HttpResponse(null, { status: 404 })
  }),

  // Workspace Members
  http.get(`${API_BASE}/workspaces/:workspaceId/members`, async () => {
    await delay(300)
    return HttpResponse.json([{
      id: 'member-1',
      workspaceId: 'ws-1',
      userId: 'mock-user-1',
      email: 'anh.nguyen@insightvault.local',
      role: 'owner',
      status: 'active',
      invitedAt: new Date().toISOString()
    }])
  }),
  http.post(`${API_BASE}/workspaces/:workspaceId/members`, async ({ request }) => {
    await delay(500)
    const data = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: `member-${Date.now()}`,
      workspaceId: 'ws-1',
      email: data.email as string,
      role: data.role as string,
      status: 'invited',
      invitedAt: new Date().toISOString()
    })
  }),
  http.patch(`${API_BASE}/workspaces/:workspaceId/members/:memberId`, async ({ request }) => {
    await delay(500)
    const data = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      id: 'member-1',
      workspaceId: 'ws-1',
      email: 'anh.nguyen@insightvault.local',
      role: data.role as string || 'owner',
      status: data.status as string || 'active',
      invitedAt: new Date().toISOString()
    })
  }),
  http.delete(`${API_BASE}/workspaces/:workspaceId/members/:memberId`, async () => {
    await delay(500)
    return new HttpResponse(null, { status: 204 })
  }),

  // Folders
  http.get(`${API_BASE}/workspaces/:workspaceId/folders`, async () => {
    await delay(300)
    return HttpResponse.json(mockFolders)
  }),
  http.post(`${API_BASE}/workspaces/:workspaceId/folders`, async ({ request, params }) => {
    await delay(600)
    const data = await request.json() as Record<string, unknown>
    const newFolder = {
      id: `fld-${Date.now()}`,
      workspaceId: params.workspaceId as string,
      name: data.name,
      description: data.description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockFolders.push(newFolder as FolderDto)
    return HttpResponse.json(newFolder)
  }),
  http.get(`${API_BASE}/folders/:folderId`, async ({ params }) => {
    await delay(300)
    const folder = mockFolders.find(f => f.id === params.folderId)
    return folder ? HttpResponse.json(folder) : new HttpResponse(null, { status: 404 })
  }),
  http.patch(`${API_BASE}/folders/:folderId`, async ({ params, request }) => {
    await delay(500)
    const data = await request.json() as Record<string, unknown>
    const index = mockFolders.findIndex(f => f.id === params.folderId)
    if (index !== -1) {
      mockFolders[index] = { ...mockFolders[index], ...data }
      return HttpResponse.json(mockFolders[index])
    }
    return new HttpResponse(null, { status: 404 })
  }),
  http.delete(`${API_BASE}/folders/:folderId`, async ({ params }) => {
    await delay(500)
    const index = mockFolders.findIndex(f => f.id === params.folderId)
    if (index !== -1) {
      mockFolders.splice(index, 1)
      return new HttpResponse(null, { status: 204 })
    }
    return new HttpResponse(null, { status: 404 })
  }),

  // Documents
  http.get(`${API_BASE}/workspaces/:workspaceId/documents`, async ({ params, request }) => {
    await delay(500)
    const url = new URL(request.url)
    const folderId = url.searchParams.get('folderId')
    
    let filtered = mockDocuments.filter(d => d.workspaceId === params.workspaceId)
    
    // Explicit null check is tricky via search params, so we convention 'root' or empty
    if (folderId) {
      filtered = filtered.filter(d => d.folderId === folderId)
    } else {
      // return only root docs if folderId is empty or not provided
      filtered = filtered.filter(d => !d.folderId)
    }
    
    return HttpResponse.json(filtered)
  }),
  http.post(`${API_BASE}/workspaces/:workspaceId/documents/presign-upload`, async ({ request }) => {
    await delay(300)
    const data = await request.json() as Record<string, unknown>
    return HttpResponse.json({
      uploadUrl: `https://mock-s3-bucket.amazonaws.com/upload-${Date.now()}`,
      documentId: `doc-${Date.now()}`,
      objectKey: `uploads/${Date.now()}-${data.fileName}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      requiredHeaders: {},
    })
  }),
  http.post(`${API_BASE}/documents/:documentId/confirm-upload`, async ({ params, request }) => {
    await delay(600)
    const data = await request.json() as Record<string, unknown>
    const newDoc = {
      id: params.documentId as string,
      workspaceId: '1', // Hardcode or mock logic
      folderId: (data._folderId as string) || null,
      originalFileName: (data._fileName as string) || 'Uploaded Document.pdf',
      fileName: (data._fileName as string) || 'Uploaded Document.pdf',
      fileType: (data.contentType as string) || 'application/pdf',
      fileSizeBytes: (data.fileSizeBytes as number) || 1024,
      status: 'processing',
      keyPoints: [],
      keywords: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockDocuments.push(newDoc as DocumentDto)
    return HttpResponse.json({ document: newDoc, aiJob: { id: 'job-1', status: 'processing', jobType: 'process_document' } })
  }),
  http.get(`${API_BASE}/documents/:documentId`, async ({ params }) => {
    await delay(300)
    const doc = mockDocuments.find(d => d.id === params.documentId)
    return doc ? HttpResponse.json(doc) : new HttpResponse(null, { status: 404 })
  }),
  http.delete(`${API_BASE}/documents/:documentId`, async ({ params }) => {
    await delay(500)
    const index = mockDocuments.findIndex(d => d.id === params.documentId)
    if (index !== -1) {
      mockDocuments.splice(index, 1)
      return new HttpResponse(null, { status: 204 })
    }
    return new HttpResponse(null, { status: 404 })
  }),

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
      contexts: (data.contexts as ChatMessageDto['contexts']) || [],
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
