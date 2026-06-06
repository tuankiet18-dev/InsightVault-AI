# AI Service Boundary Review

This review records the current AI-service implementation and the target boundary agreed by the team.

Detailed endpoint contracts are in [BE_AI_BOUNDARY_CONTRACT.md](BE_AI_BOUNDARY_CONTRACT.md).

## Current Implementation

The Python AI service exposes:

- `POST /process-document`
- `POST /rag/query`
- `POST /compare`
- `POST /generate-report`

It currently accesses:

- MinIO to read uploaded files.
- PostgreSQL to update `documents`.
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
| Wide write access | AI can still update documents and chunks. | Move document/job/report writes to backend; keep vector writes in AI only as MVP compromise. |
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

1. Backend document worker calls AI and owns `documents.status`, `documents.summary`, `documents.key_points`, `documents.keywords`, and `ai_jobs`.
2. AI `/process-document` returns chunks/embeddings/summary instead of updating `documents` directly.
3. Decide whether `document_chunks` remains AI-owned for MVP or moves fully to backend.
4. Backend resolves `@folder` subtree document ids before calling `/rag/query`.
5. If AI keeps DB access, create a restricted DB user for AI with minimal permissions.
