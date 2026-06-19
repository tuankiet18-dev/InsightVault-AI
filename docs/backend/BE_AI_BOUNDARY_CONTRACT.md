# BE-AI Boundary Contract

This document defines the agreed boundary between the ASP.NET Core backend and the Python AI service.

Current status reference: `docs/about-project/CURRENT_PROJECT_STATUS.md`.

Current implementation note: document processing, compare, report
orchestration, and Chat/RAG session/message APIs are implemented through
backend services and the AI service.

## Final Ownership Decision

Backend is the system-of-record owner.

Backend owns:

- Authentication and user identity.
- Workspace-level permission checks for all workspace, folder, document, chat, report, and AI requests.
- MinIO upload authorization and object-key creation.
- `documents`, `ai_jobs`, `chat_sessions`, `chat_messages`, `chat_message_sources`, and `reports` business state.
- Resolving `@file` and `@folder` mentions into allowed document ids before an AI request.
- Resolving active report context into allowed report Markdown plus related
  source document ids before an AI request.
- Soft delete, trash, restore, hard delete, and report versioning business rules.

AI service owns:

- Text extraction.
- Chunking.
- Embedding generation.
- Vector similarity search.
- Prompt construction.
- Gemini calls.
- Returning structured AI results to backend.

AI service must not be called directly by frontend.
AI service must not persist reports or make permission decisions.

## Current MVP Compromise

The current AI service still has PostgreSQL access for existing RAG code:

- Reads `documents` and `document_chunks`.
- Writes `document_chunks` during document processing.
- Does not update `documents` business fields.
- Does not write `reports`; `AI_ALLOW_REPORT_PERSISTENCE=false` must remain the default.

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
    -> Check workspace permission and resolve mentioned files/folders
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
System `admin` users cannot access workspace content, even if the same account appears in workspace membership. Admin APIs are limited to user/system/job monitoring and must not expose workspace content.

New MVP RAG rule:

- A chat session belongs to one workspace and defaults to workspace-wide retrieval.
- Users narrow a specific question by mentioning sources in the message:
  - `@file` resolves to one document id.
  - `@folder` resolves to all non-deleted documents inside that folder and its subfolders by default.
- Backend deduplicates all resolved document ids and sends them to AI as explicit `document_ids`.
- AI should treat explicit `document_ids` as the most precise scope.
- Direct `folder_id` RAG remains supported for compatibility, but new Backend chat flow should prefer `document_ids` so folder subtree behavior is deterministic.
- Active report chat sends `scope = "report"` with `report_context`; AI uses the
  report Markdown as evidence and may retrieve related source chunks.
- Backend must resolve only `completed` and non-deleted documents.
- AI similarity search must also filter `documents.deleted_at IS NULL` as defense in depth.
- Soft-deleted document chunks may remain physically stored, but they must be hidden from retrieval through the document filter.

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
  "document_type": "mvp_spec",
  "document_type_confidence": 0.86,
  "audience_fit": "students_founders_pm_ba",
  "summary": "Short summary",
  "key_points": ["Point 1"],
  "insights": {
    "scope": ["Core scope item"],
    "decisions": ["Decision or strong conclusion"],
    "risks": ["Risk or constraint"],
    "gaps": ["Missing or ambiguous information"],
    "next_actions": ["Recommended next action"]
  },
  "keywords": ["keyword"],
  "error": null
}
```

Target persistence:

- AI returns result.
- Backend persists document status, document intelligence fields, summary, key points, keywords, and `ai_jobs`.
- Document intelligence fields are `document_type`, `document_type_confidence`, `audience_fit`, and `insights` JSON.
- Vector chunk persistence may temporarily remain in AI for MVP.

### RAG Query

Backend implementation status: implemented. `ChatController`/`ChatService`
authenticate, resolve context, call AI, and persist messages/sources.

Backend calls AI only after checking chat workspace permission and message context ownership.
Backend resolves any `@file` / `@folder` mentions before calling AI.

RAG scope is resolved by backend before calling AI:

- Message contexts from `@folder` or `@file` mentions take priority for the current message.
- If a message has no contexts, backend uses all readable documents in the chat session workspace.
- Folder contexts resolve to completed, non-deleted documents in the folder and all subfolders by default.
- Document contexts resolve to the mentioned documents.
- Report contexts resolve to the active report Markdown plus source document ids when the report stores them.

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
  "scope": "workspace|document|folder|report",
  "folder_id": "uuid-or-null",
  "document_ids": ["uuid"],
  "report_context": "Report markdown when scope=report",
  "top_k": 5,
  "chat_history": [
    { "role": "user", "content": "Previous question" },
    { "role": "assistant", "content": "Previous answer" }
  ]
}
```

Backend mapping:

- No mention -> `scope = "workspace"`, `folder_id = null`, `document_ids = null`.
- `@file` -> `scope = "document"`, `document_ids = resolved file ids`.
- `@folder` -> `scope = "document"`, `document_ids = all resolved document ids under the folder tree`.
- Compatibility-only folder scope -> `scope = "folder"`, `folder_id = selected folder id`.
- Active report -> `scope = "report"`, `report_context = markdown`, `document_ids = report source ids when available`.
- RAG chat does not create an `ai_jobs` row.
- Viewer can call RAG chat but cannot run compare or report generation in MVP.

Response:

```json
{
  "answer": "Markdown answer",
  "sources": [
    {
      "chunk_id": "uuid",
      "document_id": "uuid",
      "file_name": "Lecture 1.pdf",
      "snippet": "Relevant text",
      "similarity": 0.82,
      "chunk_index": 3,
      "page_number": 2,
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

Persistence target in Backend:

- User message.
- Assistant message.
- Message contexts for folder, document, and report scope. Context rows store `workspace_id` and snapshot display fields so the database can enforce same-workspace references and chat history remains understandable after rename/soft delete.
- Message sources.
- Retrieval debug score in `chat_message_sources.metadata` as JSON for admin-only audit/debug.

Database safety:

- `chat_sessions` are workspace-scoped only.
- `chat_messages.workspace_id` must match the parent session workspace.
- `chat_message_contexts.workspace_id` must match the parent message workspace.
- Folder/document/report context references are nullable so approved hard delete can preserve chat history snapshots. Backend must validate same-workspace ownership before creating message contexts.
- User-facing delete for folders/documents is soft delete.
- Workspace Owner may soft-delete, restore, or hard-delete any document in the workspace.
- Editor may soft-delete, restore, or hard-delete only documents whose `uploaded_by_id` matches the current Editor.
- Viewer cannot delete, restore, or hard-delete documents.
- Hard delete from Trash removes document metadata, chunks and MinIO object. Historical chat context must use snapshots or nullable references so it does not grant access to deleted workspace content or block the approved purge flow.
- System Admin monitoring must not expose workspace questions, chunk content, snippets, report content or other workspace data.

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
- Report version records. Regenerating a report creates a new version instead of overwriting prior output. User-facing report/compare requests may include an existing `reportGroupId`; Backend validates that the group belongs to the workspace and report type, then persists the completed job output with the next `versionNumber`.
- `ai_jobs` status.
- Backend persists report data; AI service returns content only.
- User-facing report generation endpoint creates an async `generate_report` job. The worker calls AI service and persists the report.

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

Rules:

- Compare is user-triggered, not automatic after upload.
- Compare should run async through Backend job orchestration for long-running LLM calls.
- Only owner/editor can run compare in MVP.
- Backend decides source documents and excludes deleted or not-completed documents before calling AI.
- User-facing compare endpoint creates an async `compare_documents` job. The worker calls AI service and persists a `comparison_report`.

## Implementation Notes

- Keep AI service private in Docker/deployment network.
- Do not expose AI service URL to frontend.
- Use backend JWT auth for all user-facing APIs.
- Later, if AI still needs database access, create a restricted database user for AI with only the required vector-table permissions.
- Avoid adding business rules to AI service. Business rules belong in backend services.
