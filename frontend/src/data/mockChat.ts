import type { ChatSessionDto, ChatMessageDto } from '@/types/api-contract'

export const mockChatSessions: ChatSessionDto[] = [
  {
    id: 'chat-001',
    workspaceId: 'ws-001',
    title: 'MVP scope questions',
    scopeType: 'workspace',
    scopeWorkspaceId: 'ws-001',
    scopeFolderId: null,
    scopeDocumentIds: [],
    includeSubfolders: true,
    webSearchEnabled: false,
    webSearchProvider: null,
    createdAt: '2026-05-25T14:00:00Z',
    updatedAt: '2026-05-25T14:30:00Z',
  },
  {
    id: 'chat-002',
    workspaceId: 'ws-001',
    title: 'Requirement deep dive',
    scopeType: 'document',
    scopeWorkspaceId: 'ws-001',
    scopeFolderId: null,
    scopeDocumentIds: ['doc-001'],
    includeSubfolders: false,
    webSearchEnabled: false,
    webSearchProvider: null,
    createdAt: '2026-05-26T10:00:00Z',
    updatedAt: '2026-05-26T10:30:00Z',
  },
  {
    id: 'chat-003',
    workspaceId: 'ws-001',
    title: 'Research papers Q&A',
    scopeType: 'folder',
    scopeWorkspaceId: 'ws-001',
    scopeFolderId: 'folder-002',
    scopeDocumentIds: [],
    includeSubfolders: false,
    webSearchEnabled: false,
    webSearchProvider: null,
    createdAt: '2026-05-27T09:00:00Z',
    updatedAt: '2026-05-27T09:45:00Z',
  },
]

export const mockChatMessages: ChatMessageDto[] = [
  {
    id: 'msg-001',
    chatSessionId: 'chat-001',
    role: 'user',
    content: 'MVP của project gồm những chức năng nào?',
    modelName: null,
    sources: [],
    createdAt: '2026-05-25T14:00:00Z',
  },
  {
    id: 'msg-002',
    chatSessionId: 'chat-001',
    role: 'assistant',
    content: `Dựa trên tài liệu trong workspace, MVP của InsightVault AI bao gồm các chức năng chính sau:

**1. Authentication & Authorization**
- Đăng nhập bằng Google OAuth, backend phát hành JWT nội bộ
- Phân quyền hệ thống: user và admin
- Phân quyền workspace: owner, editor, viewer

**2. Workspace & Collaboration**
- Tạo, sửa, xóa workspace
- Mời thành viên bằng email, quản lý role
- Mỗi workspace có folder, document, chat, report riêng

**3. Document Management**
- Upload PDF, DOCX, TXT, Markdown vào folder
- Validate file type và size
- File gốc lưu MinIO, metadata lưu PostgreSQL

**4. AI Processing Pipeline**
- Extract text → chunk → embedding (Gemini) → lưu pgvector
- Generate summary, key points, keywords tự động
- Background job tracking với trạng thái

**5. RAG Chat**
- Hỏi đáp theo scope: document, folder, hoặc workspace
- Citation hiển thị source document và chunk

**6. Document Comparison**
- So sánh 2+ documents, phát hiện similarities, differences, gaps, conflicts
- Kết quả lưu dạng comparison report

**7. Report Generation**
- Tạo Markdown report từ document/folder/workspace
- Chưa hỗ trợ export PDF/DOCX trong MVP

**8. Admin Monitoring**
- Dashboard thống kê user, document, jobs
- Xem/retry failed jobs`,
    modelName: 'gemini-1.5-pro',
    sources: [
      {
        documentId: 'doc-001',
        documentChunkId: 'chunk-009',
        fileName: 'Requirement.docx',
        snippet: 'MVP bao gồm: Google OAuth login, shared workspace + member roles, folder management, upload document, background processing...',
        similarity: 0.86,
      },
      {
        documentId: 'doc-002',
        documentChunkId: 'chunk-021',
        fileName: 'Proposal v2.md',
        snippet: 'InsightVault AI giúp nhóm không chỉ lưu tài liệu, mà còn hiểu và khai thác tri thức từ tài liệu bằng AI...',
        similarity: 0.81,
      },
      {
        documentId: 'doc-003',
        documentChunkId: 'chunk-004',
        fileName: 'Sprint demo script.md',
        snippet: 'Demo flow: login → workspace → invite → upload → process → summary → RAG chat → compare → report → admin...',
        similarity: 0.74,
      },
    ],
    createdAt: '2026-05-25T14:01:00Z',
  },
  {
    id: 'msg-003',
    chatSessionId: 'chat-001',
    role: 'user',
    content: 'Có những chức năng nào nằm ngoài scope MVP?',
    modelName: null,
    sources: [],
    createdAt: '2026-05-25T14:05:00Z',
  },
  {
    id: 'msg-004',
    chatSessionId: 'chat-001',
    role: 'assistant',
    content: `Theo tài liệu, các chức năng sau **nằm ngoài scope MVP**:

- Realtime collaborative editing
- Cursor presence (hiển thị vị trí cursor của thành viên)
- Realtime chat giữa members
- OCR cho file scan/ảnh chụp
- Mobile app native (Flutter để phase sau)
- Voice note
- Obsidian plugin
- Knowledge graph nâng cao
- Version control document phức tạp
- Export PDF/DOCX
- Notification realtime
- Billing/payment
- Fine-tuning model
- Phân quyền chi tiết theo từng folder/document

Đây là danh sách "out of scope" được ghi rõ trong requirement document.`,
    modelName: 'gemini-1.5-pro',
    sources: [
      {
        documentId: 'doc-001',
        documentChunkId: 'chunk-045',
        fileName: 'Requirement.docx',
        snippet: 'Out of scope: realtime editing, cursor presence, realtime chat, OCR, mobile app, voice note...',
        similarity: 0.92,
      },
    ],
    createdAt: '2026-05-25T14:06:00Z',
  },
]
