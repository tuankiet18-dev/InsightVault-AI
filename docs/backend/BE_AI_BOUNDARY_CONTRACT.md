# BE-AI Boundary Contract

This document defines the agreed boundary between the ASP.NET Core backend and the Python AI service.

## Final Ownership Decision

Backend is the system-of-record owner.

Backend owns:

- Authentication and user identity.
- Workspace/folder/document permission checks.
- MinIO upload authorization and object-key creation.
- `documents`, `ai_jobs`, `chat_sessions`, `chat_messages`, `chat_message_sources`, and `reports` business state.
- Deciding which workspace, folder, subfolder, and document ids are allowed for an AI request.

AI service owns:

- Text extraction.
- Chunking.
- Embedding generation.
- Vector similarity search.
- Prompt construction.
- Gemini calls.
- Returning structured AI results to backend.

AI service must not be called directly by frontend.

## Current MVP Compromise

The current AI service still has PostgreSQL access for existing RAG code:

- Reads `documents` and `document_chunks`.
- Writes `document_chunks` during document processing.
- Updates document processing fields in the current `/process-document` flow.
- Can write `reports` only when `AI_ALLOW_REPORT_PERSISTENCE=true`.

This is accepted as an MVP transition state, not the final architecture.

Default config:

```env
AI_ALLOW_REPORT_PERSISTENCE=false
```

With this default, report generation and comparison return content to backend, and backend should decide whether/how to persist it.

## Target Processing Flow

```text
Frontend
  -> Backend
    -> Authenticate JWT
    -> Check workspace/folder/document permission
    -> Create or update document metadata
    -> Create ai_job
    -> Send internal request or queue message to AI service
      -> AI extracts text, chunks, embeds, summarizes
      -> AI returns structured result
    -> Backend persists document status, summary, ai_job status, reports/chat state
  -> Frontend polls or receives status update from Backend
```

## Request Rules

Every backend-to-AI request must include only resources the current user is allowed to access.

AI service may validate required fields, but it must not be responsible for user permissions.

For folder-scoped RAG:

- If `include_subfolders=false`, backend can pass the selected `folder_id`.
- If `include_subfolders=true`, backend should resolve the folder tree and pass explicit `document_ids`.
- AI service should treat explicit `document_ids` as the most precise scope.

## Endpoint Contracts

### Process Document

Backend calls AI after the file exists in MinIO and the user is authorized.

Request:

```json
{
  "document_id": "uuid",
  "workspace_id": "uuid",
  "folder_id": "uuid-or-null",
  "minio_bucket": "insightvault-documents",
  "minio_object_key": "workspaces/{workspaceId}/documents/{documentId}/original",
  "file_type": "pdf|docx|txt|md",
  "file_name": "Lecture 1.pdf"
}
```

Response:

```json
{
  "status": "success",
  "document_id": "uuid",
  "chunk_count": 12,
  "summary": "Short summary",
  "key_points": ["Point 1"],
  "keywords": ["keyword"],
  "error": null
}
```

Target persistence:

- AI returns result.
- Backend persists document status, summary, key points, keywords, and `ai_jobs`.
- Vector chunk persistence may temporarily remain in AI for MVP.

### RAG Query

Backend calls AI only after checking chat workspace permission and message context ownership.

RAG scope is resolved by backend before calling AI:

- Message contexts from `@folder` or `@document` mentions take priority for the current message.
- If a message has no contexts, backend uses all readable documents in the chat session workspace.
- Folder contexts resolve to documents in the folder, optionally including subfolders.
- Document contexts resolve to the mentioned documents.

Retrieval uses hybrid RAG:

- Dense branch: Gemini query embedding + pgvector cosine search.
- Sparse branch: PostgreSQL full-text search over original chunk content.
- Normalized sparse branch: PostgreSQL full-text search over accent-insensitive normalized chunk content.
- Fusion: Reciprocal Rank Fusion deduplicates chunks and returns the final top-k.

The original chunk content remains the only text used for prompt context and citations.
Normalized content is only for retrieval recall.

Request:

```json
{
  "question": "Explain chapter 1",
  "workspace_id": "uuid",
  "scope": "workspace|folder|document",
  "folder_id": "uuid-or-null",
  "document_ids": ["uuid"],
  "top_k": 5,
  "chat_history": [
    { "role": "user", "content": "Previous question" },
    { "role": "assistant", "content": "Previous answer" }
  ]
}
```

Response:

```json
{
  "answer": "AI answer",
  "sources": [
    {
      "chunk_id": "uuid",
      "document_id": "uuid",
      "file_name": "Lecture 1.pdf",
      "snippet": "Relevant text",
      "similarity": 0.82,
      "retrieval_debug": {
        "dense_rank": 1,
        "dense_score": 0.82,
        "sparse_original_rank": 3,
        "sparse_original_score": 0.15,
        "sparse_normalized_rank": 2,
        "sparse_normalized_score": 0.21,
        "fusion_score": 0.0484
      }
    }
  ],
  "web_sources": []
}
```

Backend persists:

- User message.
- Assistant message.
- Message sources.
- Retrieval debug score in `chat_message_sources.metadata` as JSON for admin-only audit/debug.

Admin debug endpoint:

```text
GET /api/admin/retrieval-debug?workspaceId={uuid}&chatMessageId={uuid}&limit=50
```

The endpoint requires an admin JWT role and returns source metadata with `retrievalDebug`.

### Generate Report

Backend decides report type, source documents, and persistence.

Request:

```json
{
  "workspace_id": "uuid",
  "folder_id": "uuid-or-null",
  "created_by_id": "uuid",
  "ai_job_id": "uuid-or-null",
  "document_ids": ["uuid"],
  "report_type": "summary_report",
  "title": "Optional title",
  "custom_prompt": null,
  "store_report": false
}
```

Response:

```json
{
  "report_type": "summary_report",
  "markdown_content": "# Report",
  "report_id": null
}
```

Backend persists:

- `reports`.
- Report version records later if versioning is implemented.
- `ai_jobs` status.

### Compare Documents

Request:

```json
{
  "workspace_id": "uuid",
  "folder_id": "uuid-or-null",
  "created_by_id": "uuid",
  "ai_job_id": "uuid-or-null",
  "document_ids": ["uuid-1", "uuid-2"],
  "document_names": ["A.pdf", "B.pdf"],
  "title": "Optional title",
  "store_report": false
}
```

Response:

```json
{
  "objectives": "Comparison objective",
  "scope": "Compared scope",
  "similarities": [],
  "differences": [],
  "missing_information": [],
  "potential_conflicts": [],
  "recommendations": [],
  "raw_markdown": "# Compare",
  "report_id": null
}
```

Backend persists report content if the user requests saving it.

## Implementation Notes

- Keep AI service private in Docker/deployment network.
- Do not expose AI service URL to frontend.
- Use backend JWT auth for all user-facing APIs.
- Later, if AI still needs database access, create a restricted database user for AI with only the required vector-table permissions.
- Avoid adding business rules to AI service. Business rules belong in backend services.
