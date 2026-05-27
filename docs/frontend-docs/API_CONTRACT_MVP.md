# InsightVault AI - MVP API Contract

Status: contract for implementation. Frontend calls only Backend APIs. Backend calls AI Service internally. AI Service is not exposed directly to browsers.

## Global Rules

- FE base URL: `VITE_API_BASE_URL`, default `http://localhost:5000/api`.
- BE base route: `/api`.
- AI base URL: internal config, default `http://127.0.0.1:8000`.
- Auth: `Authorization: Bearer <jwt>` for every business API.
- Public APIs: `GET /api/health`, `GET /api/health/db`, `GET /api/meta`, `POST /api/auth/google`.
- IDs are UUID strings.
- Dates are ISO-8601 strings.
- Soft delete returns `204 No Content`.
- Error response:

```json
{
  "errorCode": "workspace.not_found",
  "message": "Workspace not found",
  "details": {}
}
```

## Shared Enums

```ts
type SystemRole = "user" | "admin";
type WorkspaceRole = "owner" | "editor" | "viewer";
type MemberStatus = "invited" | "active" | "removed";
type DocumentStatus = "pending_upload" | "uploaded" | "processing" | "completed" | "failed";
type AiJobType = "process_document" | "generate_report" | "compare_documents";
type AiJobStatus = "queued" | "processing" | "completed" | "failed";
type ChatScopeType = "workspace" | "folder" | "document";
type ChatMessageRole = "user" | "assistant";
type ReportType = "summary_report" | "comparison_report" | "gap_analysis_report" | "section_report";
```

## Core DTOs

```ts
type UserDto = {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  systemRole: SystemRole;
  isActive: boolean;
  lastLoginAt?: string | null;
};

type WorkspaceDto = {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  isArchived: boolean;
  currentUserRole: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
};

type DocumentDto = {
  id: string;
  workspaceId: string;
  folderId?: string | null;
  fileName: string;
  originalFileName: string;
  fileType: string;
  mimeType?: string | null;
  fileSizeBytes: number;
  status: DocumentStatus;
  summary?: string | null;
  keyPoints: string[];
  keywords: string[];
  processingError?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

type AiJobDto = {
  id: string;
  workspaceId?: string | null;
  documentId?: string | null;
  jobType: AiJobType;
  status: AiJobStatus;
  retryCount: number;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
};
```

## Backend APIs For Frontend

### Health And Meta

| Method | Path | Auth | Response |
|---|---|---:|---|
| GET | `/api/health` | No | `{ status, message }` |
| GET | `/api/health/db` | No | `{ status, message }` |
| GET | `/api/meta` | No | `{ name, description, mvpCapabilities }` |

### Auth

`POST /api/auth/google`

Request:

```json
{
  "idToken": "google-id-token"
}
```

Response:

```json
{
  "accessToken": "jwt",
  "expiresAt": "2026-05-27T10:15:00Z",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "User Name",
    "avatarUrl": null,
    "systemRole": "user",
    "isActive": true,
    "lastLoginAt": "2026-05-27T10:00:00Z"
  }
}
```

Other auth APIs:

| Method | Path | Auth | Notes |
|---|---|---:|---|
| GET | `/api/auth/me` | Yes | Return `UserDto` |
| POST | `/api/auth/logout` | Yes | Stateless JWT logout, return `204` |

### Workspaces

| Method | Path | Auth | Request | Response |
|---|---|---:|---|---|
| GET | `/api/workspaces?q=` | Yes | - | `WorkspaceDto[]` |
| POST | `/api/workspaces` | Yes | `{ name, description? }` | `WorkspaceDto` |
| GET | `/api/workspaces/{workspaceId}` | Yes | - | `WorkspaceDto` |
| PATCH | `/api/workspaces/{workspaceId}` | Yes | `{ name?, description?, isArchived? }` | `WorkspaceDto` |
| DELETE | `/api/workspaces/{workspaceId}` | Yes | - | `204` |

Rules:

- Creator becomes `owner`.
- Any workspace access must verify membership.
- Only `owner` can delete workspace or manage members.

### Workspace Members

| Method | Path | Auth | Request | Response |
|---|---|---:|---|---|
| GET | `/api/workspaces/{workspaceId}/members` | Yes | - | `WorkspaceMemberDto[]` |
| POST | `/api/workspaces/{workspaceId}/members` | Yes | `{ email, role }` | `WorkspaceMemberDto` |
| PATCH | `/api/workspaces/{workspaceId}/members/{memberId}` | Yes | `{ role?, status? }` | `WorkspaceMemberDto` |
| DELETE | `/api/workspaces/{workspaceId}/members/{memberId}` | Yes | - | `204` |

```ts
type WorkspaceMemberDto = {
  id: string;
  workspaceId: string;
  userId?: string | null;
  email: string;
  role: WorkspaceRole;
  status: MemberStatus;
  invitedById?: string | null;
  invitedAt: string;
  joinedAt?: string | null;
};
```

### Folders

| Method | Path | Auth | Request | Response |
|---|---|---:|---|---|
| GET | `/api/workspaces/{workspaceId}/folders?parentFolderId=` | Yes | - | `FolderDto[]` |
| POST | `/api/workspaces/{workspaceId}/folders` | Yes | `{ name, description?, parentFolderId? }` | `FolderDto` |
| GET | `/api/folders/{folderId}` | Yes | - | `FolderDto` |
| PATCH | `/api/folders/{folderId}` | Yes | `{ name?, description?, parentFolderId? }` | `FolderDto` |
| DELETE | `/api/folders/{folderId}` | Yes | - | `204` |

```ts
type FolderDto = {
  id: string;
  workspaceId: string;
  parentFolderId?: string | null;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
};
```

### Documents With Presigned Upload

The MVP uses direct browser upload to MinIO through a presigned URL. BE remains the authority for permissions, object key generation, metadata, and AI job creation.

Flow:

```text
FE -> BE: request presigned upload URL
BE: check JWT + workspace role owner/editor
BE: create document with status pending_upload
BE: create random object key
BE -> FE: uploadUrl + documentId
FE -> MinIO: PUT file to uploadUrl
FE -> BE: confirm upload
BE: HEAD object, validate size/type/key/status
BE: mark uploaded, create process_document AI job
```

`POST /api/workspaces/{workspaceId}/documents/presign-upload`

Request:

```json
{
  "folderId": "uuid-or-null",
  "fileName": "proposal.pdf",
  "fileSizeBytes": 123456,
  "contentType": "application/pdf"
}
```

Response:

```json
{
  "documentId": "uuid",
  "uploadUrl": "https://minio-presigned-put-url",
  "objectKey": "workspaces/{workspaceId}/documents/{documentId}/original.pdf",
  "expiresAt": "2026-05-27T10:15:00Z",
  "requiredHeaders": {
    "Content-Type": "application/pdf"
  }
}
```

`POST /api/documents/{documentId}/confirm-upload`

Request:

```json
{
  "fileSizeBytes": 123456,
  "contentType": "application/pdf"
}
```

Response:

```json
{
  "document": {},
  "aiJob": {}
}
```

Other document APIs:

| Method | Path | Auth | Notes |
|---|---|---:|---|
| GET | `/api/workspaces/{workspaceId}/documents?folderId=&status=&q=` | Yes | List documents |
| GET | `/api/documents/{documentId}` | Yes | Detail with summary |
| DELETE | `/api/documents/{documentId}` | Yes | Soft delete metadata and MinIO object if possible |
| POST | `/api/documents/{documentId}/retry-processing` | Yes | Create new `process_document` job |

Upload security requirements:

- Bucket must stay private.
- FE must never choose bucket or object key.
- Presigned URL TTL should be short, recommended 5-15 minutes.
- BE validates membership and `owner/editor` role before presign.
- BE validates extension, MIME type, file size, and document status on confirm.
- BE must reject confirm if object key does not match the document record.

### AI Jobs

| Method | Path | Auth | Response |
|---|---|---:|---|
| GET | `/api/workspaces/{workspaceId}/ai-jobs?status=&type=` | Yes | `AiJobDto[]` |
| GET | `/api/ai-jobs/{jobId}` | Yes | `AiJobDto` |
| POST | `/api/ai-jobs/{jobId}/retry` | Yes | `AiJobDto` |

### Chat And RAG

Chat session can target multiple documents when `scopeType = "document"`.

```ts
type ChatSessionDto = {
  id: string;
  workspaceId: string;
  title?: string | null;
  scopeType: ChatScopeType;
  scopeWorkspaceId?: string | null;
  scopeFolderId?: string | null;
  scopeDocumentIds?: string[];
  includeSubfolders: boolean;
  webSearchEnabled?: boolean;
  webSearchProvider?: "duckduckgo" | "searxng" | "brave" | null;
  createdAt: string;
  updatedAt: string;
};
```

| Method | Path | Auth | Request | Response |
|---|---|---:|---|---|
| GET | `/api/workspaces/{workspaceId}/chat-sessions` | Yes | - | `ChatSessionDto[]` |
| POST | `/api/workspaces/{workspaceId}/chat-sessions` | Yes | `CreateChatSessionRequest` | `ChatSessionDto` |
| GET | `/api/chat-sessions/{sessionId}/messages` | Yes | - | `ChatMessageDto[]` |
| POST | `/api/chat-sessions/{sessionId}/messages` | Yes | `{ content, webSearchOptions? }` | `ChatTurnResponse` |
| DELETE | `/api/chat-sessions/{sessionId}` | Yes | - | `204` |

```ts
type CreateChatSessionRequest = {
  title?: string | null;
  scopeType: ChatScopeType;
  scopeWorkspaceId?: string | null;
  scopeFolderId?: string | null;
  scopeDocumentIds?: string[];
  includeSubfolders?: boolean;
  webSearchEnabled?: boolean;
  webSearchProvider?: "duckduckgo" | "searxng" | "brave" | null;
};

type ChatMessageDto = {
  id: string;
  chatSessionId: string;
  role: ChatMessageRole;
  content: string;
  modelName?: string | null;
  sources: ChatSourceDto[];
  webSources?: WebSourceDto[];
  createdAt: string;
};

type ChatSourceDto = {
  documentId: string;
  documentChunkId?: string | null;
  fileName: string;
  snippet: string;
  similarity?: number | null;
};

type WebSourceDto = {
  title: string;
  url: string;
  snippet?: string | null;
  provider?: string | null;
};

type ChatTurnResponse = {
  userMessage: ChatMessageDto;
  assistantMessage: ChatMessageDto;
};
```

Web search fields are contract-only for the current phase. BE and AI may ignore them until the web search phase.

### Compare

`POST /api/workspaces/{workspaceId}/compare`

Request:

```json
{
  "folderId": "uuid-or-null",
  "documentIds": ["uuid-1", "uuid-2"],
  "title": "Comparison report",
  "storeReport": true,
  "webSearchOptions": {
    "enabled": false,
    "provider": "searxng",
    "maxResults": 5
  }
}
```

Response:

```json
{
  "objectives": "...",
  "scope": "...",
  "similarities": [],
  "differences": [],
  "missingInformation": [],
  "potentialConflicts": [],
  "recommendations": [],
  "rawMarkdown": "...",
  "reportId": "uuid-or-null"
}
```

### Reports

| Method | Path | Auth | Request | Response |
|---|---|---:|---|---|
| GET | `/api/workspaces/{workspaceId}/reports?type=` | Yes | - | `ReportDto[]` |
| GET | `/api/reports/{reportId}` | Yes | - | `ReportDto` |
| POST | `/api/workspaces/{workspaceId}/reports/generate` | Yes | `GenerateReportRequest` | `ReportDto` |
| DELETE | `/api/reports/{reportId}` | Yes | - | `204` |

```ts
type GenerateReportRequest = {
  folderId?: string | null;
  documentIds: string[];
  reportType: ReportType;
  title?: string | null;
  customPrompt?: string | null;
  storeReport?: boolean;
  webSearchOptions?: WebSearchOptions;
};

type ReportDto = {
  id: string;
  workspaceId: string;
  folderId?: string | null;
  title: string;
  reportType: ReportType;
  markdownContent: string;
  sourceDocuments: string[];
  structuredResult: unknown;
  modelName?: string | null;
  createdAt: string;
  updatedAt: string;
};
```

### Dashboard And Admin

| Method | Path | Auth | Role | Response |
|---|---|---:|---|---|
| GET | `/api/dashboard/me` | Yes | user/admin | `UserDashboardDto` |
| GET | `/api/admin/users?q=&isActive=` | Yes | admin | `UserDto[]` |
| PATCH | `/api/admin/users/{userId}` | Yes | admin | `UserDto` |
| GET | `/api/admin/ai-jobs?status=&type=` | Yes | admin | `AiJobDto[]` |

```ts
type UserDashboardDto = {
  workspaceCount: number;
  folderCount: number;
  documentCount: number;
  completedDocumentCount: number;
  processingDocumentCount: number;
  failedDocumentCount: number;
  reportCount: number;
  recentJobs: AiJobDto[];
};
```

## Backend To AI Service APIs

### `POST /process-document`

Request:

```json
{
  "document_id": "uuid",
  "workspace_id": "uuid",
  "folder_id": "uuid-or-null",
  "minio_bucket": "insightvault",
  "minio_object_key": "workspaces/.../original.pdf",
  "file_type": "pdf",
  "file_name": "proposal.pdf"
}
```

Response:

```json
{
  "status": "success",
  "document_id": "uuid",
  "chunk_count": 12,
  "summary": "...",
  "key_points": [],
  "keywords": [],
  "error": null
}
```

### `POST /rag/query`

Request:

```json
{
  "question": "MVP gom nhung gi?",
  "workspace_id": "uuid",
  "scope": "document",
  "folder_id": null,
  "document_ids": ["uuid-1", "uuid-2"],
  "top_k": 5,
  "chat_history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "web_search_options": {
    "enabled": false,
    "provider": "searxng",
    "max_results": 5
  }
}
```

Response:

```json
{
  "answer": "...",
  "sources": [
    {
      "chunk_id": "uuid",
      "document_id": "uuid",
      "file_name": "proposal.pdf",
      "snippet": "...",
      "similarity": 0.82
    }
  ],
  "web_sources": []
}
```

`web_search_options` and `web_sources` are optional and reserved for a later phase.

### `POST /compare`

Request:

```json
{
  "workspace_id": "uuid",
  "folder_id": null,
  "created_by_id": "uuid",
  "ai_job_id": "uuid",
  "document_ids": ["uuid-1", "uuid-2"],
  "document_names": ["proposal.pdf", "requirements.pdf"],
  "title": "Comparison report",
  "store_report": true,
  "web_search_options": {
    "enabled": false,
    "provider": "searxng",
    "max_results": 5
  }
}
```

### `POST /generate-report`

Request:

```json
{
  "workspace_id": "uuid",
  "folder_id": null,
  "created_by_id": "uuid",
  "ai_job_id": "uuid",
  "document_ids": ["uuid-1"],
  "report_type": "summary_report",
  "title": "Summary",
  "custom_prompt": null,
  "store_report": true,
  "web_search_options": {
    "enabled": false,
    "provider": "searxng",
    "max_results": 5
  }
}
```

## FE Implementation Checklist

- Create `src/api/http.ts` with JWT injection and shared error parsing.
- Create `src/api/authApi.ts`, `workspaceApi.ts`, `folderApi.ts`, `documentApi.ts`, `chatApi.ts`, `reportApi.ts`, `adminApi.ts`.
- For presigned upload: request URL from BE, upload file to MinIO with exact `requiredHeaders`, then call confirm.
- Never store MinIO credentials in FE.
- Treat web search fields as optional UI-disabled values for now.

## BE Implementation Checklist

- Keep MinIO bucket private.
- Add service for presigned PUT URL generation.
- Add confirm-upload validation with MinIO `StatObject`.
- Add permission service for workspace membership and role checks.
- Add AI service client for `process-document`, `rag/query`, `compare`, and `generate-report`.
- Add OpenAPI examples matching this document.

## AI Implementation Checklist

- Keep existing logic for document processing, RAG, compare, and report.
- Accept optional web search fields without requiring logic.
- Return `web_sources: []` only when implemented or when BE contract needs it.
- Keep permission validation in BE, not AI.
