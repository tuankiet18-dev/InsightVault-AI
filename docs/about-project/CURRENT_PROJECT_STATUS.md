# InsightVault AI - Current Project Status

Last updated: 2026-06-17.

This page is the current status anchor for the repository. Code, migrations,
runtime logs, and test output remain the source of truth; this document distills
the state that the team should not have to rediscover.

## Current Product Shape

InsightVault AI is now an MVP-stage collaborative document intelligence
workspace:

- React/Vite frontend for login, dashboard, workspace UI, chat/compare pages,
  and admin pages.
- ASP.NET Core backend for auth, workspace/member permissions, folder/document
  orchestration, MinIO upload, AI jobs, reports/compare, admin/dashboard
  metadata, Chat/RAG sessions, billing, PayOS checkout, SMTP email queue, and
  EF Core migrations.
- FastAPI AI service for document extraction, chunking, embeddings, RAG query,
  compare, and Markdown report generation.
- Docker Compose stack with frontend, backend, AI service, PostgreSQL +
  pgvector, RabbitMQ, and MinIO.

## Verified Runtime Snapshot

The stack was built and started locally through the Docker-only workflow:

```powershell
.\scripts\setup.ps1
.\scripts\start-docker-fast.ps1
.\scripts\backend-smoke.ps1
```

Observed healthy endpoints:

- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:5126/health/live`
- Backend readiness: `http://localhost:5126/health/ready`
- Backend OpenAPI: `http://localhost:5126/openapi/v1.json`
- AI service docs: `http://localhost:8000/docs`
- MinIO console: `http://localhost:9001`
- RabbitMQ management: `http://localhost:15672`

Backend automated tests passed:

```text
Passed: 19, Failed: 0, Skipped: 0
```

## Implemented Backend Capabilities

- Google login endpoint and JWT-protected business APIs.
- User, workspace, member, role, and permission services.
- Workspace member invite/update/remove flow with email messages queued through
  RabbitMQ when SMTP is enabled.
- Folder CRUD and folder-tree soft delete behavior.
- Presigned upload, confirm upload, document metadata, MinIO storage
  integration, soft delete, restore, hard delete, and retry processing.
- RabbitMQ-backed workers for document processing and AI jobs.
- AI service client calls for document processing, compare, and report
  generation.
- Workspace-scoped Chat/RAG APIs for private chat sessions, persisted
  messages, per-message folder/document/report context, and source citations.
- AI job list/detail/retry APIs.
- Report and compare APIs with async job polling and backend-owned report
  persistence/versioning.
- User dashboard and admin user/job monitoring APIs.
- Workspace-scoped billing, subscription plans, credit top-ups, PayOS checkout,
  PayOS webhook handling, and credit ledger/debit/refund logic.

## Implemented AI Service Capabilities

- `/process-document`: reads source files from MinIO, extracts text, chunks,
  embeds, writes `document_chunks`, and returns document intelligence output.
- `/rag/query`: performs RAG over workspace/folder/document/report scope or
  explicit `document_ids`; report scope accepts current report Markdown as
  context and can still retrieve related source chunks.
- `/compare`: compares documents and returns structured differences, gaps,
  conflicts, recommendations, and Markdown fallback content.
- `/generate-report`: returns Markdown report content and structured metadata.
- AI service may still read `documents` and read/write `document_chunks` in the
  MVP. It must not own workspace permissions.

## Implemented Frontend Capabilities

- Public landing and login routes.
- Protected user dashboard.
- Protected workspace page.
- Chat, compare, and report workspace components are present.
- AI Inspector Ask mode is connected to backend Chat/RAG sessions and can
  narrow scope from the active document, folder, or report tab.
- Admin dashboard/users/jobs routes are protected by system admin checks.
- Workspace member management modal supports search, pagination, role update,
  and remove actions.

## Known Gaps

These are not done yet and should not be presented as completed:

- Billing UI is not complete. Backend billing APIs exist, but frontend routes
  for pricing/billing/success/cancel and top-up checkout are still needed.
- Real external-provider testing is still pending for Google OAuth, Gemini,
  PayOS webhook, and SMTP.
- Manual acceptance testing is still needed for owner/editor/viewer boundaries,
  upload through MinIO, Chat/RAG answers with real Gemini, async report/compare,
  admin privacy, billing debit/refund behavior, and failure/retry paths.
- `google.generativeai` in the AI service emits a deprecation warning and should
  be migrated to `google.genai`.

## Current MVP Completion Assessment

The project is no longer a skeleton. It is a runnable MVP candidate with most
backend and infrastructure flows in place. The largest product gaps before a
clean demo are:

1. Run a manual Chat/RAG E2E pass with completed documents and real Gemini
   credentials, including report-context questions and citation navigation.
2. Add billing/subscription/top-up UI around the existing backend APIs.
3. Run a full manual E2E pass using real Google/Gemini/PayOS/SMTP credentials.
4. Polish frontend flows for document readiness, compare/report polling, report
   viewing, and role-based action visibility.
5. Refresh OpenAPI/Postman artifacts after backend API changes.

## Source Notes

- `infra/openapi.json` is currently an untracked local generated artifact. Treat
  backend code and `http://localhost:5126/openapi/v1.json` as the live API
  source until the team decides where generated OpenAPI should live.
- `docs/backend/BACKEND_MVP_MANUAL_TEST_CHECKLIST.md` is the manual acceptance
  checklist for integrated runtime behavior.
- `docs/frontend-docs/API_CONTRACT_MVP.md` describes the active FE/BE
  contract, including Chat/RAG session/message endpoints.
