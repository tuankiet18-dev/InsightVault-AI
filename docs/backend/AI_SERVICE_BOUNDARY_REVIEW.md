# AI Service Boundary Review

This review records the current AI-service implementation and the target boundary agreed by the team.

Detailed endpoint contracts are in [BE_AI_BOUNDARY_CONTRACT.md](BE_AI_BOUNDARY_CONTRACT.md).

Update 2026-06-15: backend workers now own document/job status updates and
report persistence for document processing, compare, and report generation. AI
service still owns extraction, chunking, embedding, retrieval, prompt logic, and
Gemini calls. Backend Chat/RAG APIs remain pending.

## Current Implementation

The Python AI service exposes:

- `POST /process-document`
- `POST /rag/query`
- `POST /compare`
- `POST /generate-report`

It currently accesses:

- MinIO to read uploaded files.
- PostgreSQL/pgvector to insert/search `document_chunks`.
- PostgreSQL to read document metadata and chunk content.
- PostgreSQL to insert `reports`, but only when explicitly enabled.

## Boundary Decision

Backend is the system-of-record owner.

Backend owns authentication, authorization, business rules, and persistence of business state. AI service owns AI computation: extraction, chunking, embedding, retrieval, prompting, and Gemini calls.

Frontend must call backend only. AI service is an internal service.

## Risk Review

| Risk | Current State | Direction |
|---|---|---|
| Permission bypass | AI endpoints accept ids and do not know user permissions. | Backend must validate permissions before every AI call. |
| Tight DB coupling | AI service depends on database table/column names. | Keep for MVP, reduce over time by returning structured results to backend. |
| Wide write access | AI still writes chunks and may write reports only in legacy/explicit mode. Backend owns document/job/report state in the current flow. | Keep vector writes in AI only as MVP compromise; avoid enabling AI report persistence. |
| Report persistence outside backend | Previously defaulted to `store_report=true`. | Default is now `false`; `AI_ALLOW_REPORT_PERSISTENCE=false` blocks accidental AI report writes. |
| Folder mention subtree | AI folder scope currently filters by one `folder_id`. | New chat flow should resolve `@folder` plus subfolders to explicit `document_ids` before calling AI. |

## Current Safe Defaults

```env
AI_ALLOW_REPORT_PERSISTENCE=false
```

With this setting:

- `/generate-report` returns Markdown content but does not insert `reports`.
- `/compare` returns comparison content but does not insert `reports`.
- Backend can persist returned content after permission checks and job-state updates.

## Recommended Next Refactors

1. Implement backend Chat/RAG APIs that call AI `/rag/query`, persist messages,
   and save sources/citations.
2. Backend resolves `@folder` subtree document ids before calling `/rag/query`.
3. Decide whether `document_chunks` remains AI-owned for MVP or moves fully to
   backend.
4. If AI keeps DB access, create a restricted DB user for AI with minimal
   permissions.
5. Migrate AI service from deprecated `google.generativeai` to `google.genai`.
