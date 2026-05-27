# AI Service Boundary Review

This note reviews the current RAG implementation after the AI service merge and the recommended boundary with the ASP.NET Core backend.

## Current Implementation

The Python AI service currently exposes:

- `POST /process-document`
- `POST /rag/query`
- `POST /compare`
- `POST /generate-report`

It also directly accesses:

- MinIO, to read uploaded files.
- PostgreSQL, to update `documents`.
- PostgreSQL/pgvector, to insert/search `document_chunks`.
- PostgreSQL, to insert `reports`.

This is workable for MVP speed, but it gives the AI service a wide data-access boundary.

## What Is Good

- Chunking, embedding, retrieval, prompting, and Gemini calls are in the AI service. That is a reasonable separation because these are AI-specific responsibilities.
- Backend does not need to know how chunks, embeddings, vector search, or prompts are implemented.
- The `/process-document` contract is clear enough for backend orchestration after upload.

## Main Risks

| Risk | Why It Matters |
|---|---|
| Permission bypass | AI service endpoints accept workspace/document ids. If exposed publicly, callers could query/process documents without backend permission checks. |
| Tight database coupling | AI service depends on exact PostgreSQL table/column names. Backend migrations can break AI service. |
| Too much write access | AI service can update `documents` and insert `reports`, so business state changes can happen outside backend rules. |
| Harder job tracking | Backend creates `ai_jobs`, but AI service currently updates documents/reports directly and does not consistently own job status transitions. |

## Recommended Boundary For System Design

Use backend as the system-of-record owner:

```text
Frontend
  -> Backend API
    -> permission checks
    -> MinIO upload
    -> documents/ai_jobs/chat/reports metadata
    -> internal call/queue to AI service
      -> extraction/chunking/embedding/RAG/Gemini
    <- structured result
  <- response to frontend
```

AI service should own AI computation, not user permissions.

## Practical MVP Compromise

For this semester project, the team can keep the current AI service database access if time is tight, but apply these rules:

1. Do not let frontend call AI service directly.
2. Backend must validate workspace membership and document access before calling AI service.
3. Backend should pass only allowed document ids/object keys to AI service.
4. AI service should be private in Docker/deploy networking.
5. Later, restrict the AI service database user to only the tables it truly needs.

## Cleaner Target Design

Best target design:

- Backend uploads file to MinIO and creates `documents` + `ai_jobs`.
- Backend worker calls `POST /process-document`.
- AI service returns summary, key points, keywords, chunks, and embeddings or stores only chunks if agreed.
- Backend updates `documents`, `ai_jobs`, `reports`, and chat persistence.

The only exception that can be acceptable: AI service may write `document_chunks` directly because vector persistence is tightly related to embedding. If doing this, document it as an intentional boundary decision.

## Recommendation

For now:

- Keep chunking/embedding in AI service.
- Keep RAG query logic in AI service.
- Move ownership of `documents`, `ai_jobs`, `chat_messages`, `chat_message_sources`, and `reports` toward backend over time.
- Treat direct AI service writes to PostgreSQL as an MVP shortcut, not the final architecture.
