# Backend MVP Manual Test Checklist

This checklist is the backend MVP acceptance pass after the folder/document, trash, AI jobs, reports/compare, admin, dashboard, and deployment hardening branches.

It complements CI. CI proves the code builds; this checklist proves the integrated product flows work with PostgreSQL, MinIO, RabbitMQ, the Python AI service, and real authorization data.

## Current Scope

Covered:

- Backend startup and health checks.
- Workspace/folder/document metadata rules.
- Presigned upload, confirm upload, document processing jobs.
- Trash, restore, hard delete, and retention behavior.
- AI jobs list/detail/retry.
- Async compare and report generation.
- Dashboard and admin monitoring metadata-only responses.
- Backend-to-AI service boundary expectations.

Known gap to track separately:

- Backend Chat/RAG API endpoints from the API contract are not implemented in the current backend codebase. The database has chat tables and the AI service has RAG support, but there is no `ChatController`/`ChatService` API layer yet. Do not mark RAG chat as passed until these backend endpoints exist:
  - `GET /api/workspaces/{workspaceId}/chat-sessions`
  - `POST /api/workspaces/{workspaceId}/chat-sessions`
  - `GET /api/chat-sessions/{sessionId}/messages`
  - `POST /api/chat-sessions/{sessionId}/messages`
  - `DELETE /api/chat-sessions/{sessionId}`

## Preconditions

Create local env files if missing:

```powershell
Copy-Item infra/.env.example infra/.env
Copy-Item ai-service/.env.example ai-service/.env
Copy-Item backend/InsightVault.API/appsettings.Development.example.json backend/InsightVault.API/appsettings.Development.json
```

Then replace placeholder values:

- `infra/.env`: set non-placeholder Postgres, MinIO, RabbitMQ, and `JWT_SIGNING_KEY` values.
- `ai-service/.env`: set a valid `GEMINI_API_KEY`.
- `backend/InsightVault.API/appsettings.Development.json`: keep local-only values or use environment variables.

Start the stack:

```powershell
.\scripts\start-docker-fast.ps1
```

Quick smoke check:

```powershell
.\scripts\backend-smoke.ps1
```

If only backend is running without PostgreSQL, use:

```powershell
.\scripts\backend-smoke.ps1 -SkipReady
```

Prepare these users:

- `ownerUser`: active workspace owner.
- `editorUser`: active workspace editor.
- `viewerUser`: active workspace viewer.
- `adminUser`: active system admin.
- `inactiveOrInvitedUser`: inactive user or invited workspace member if available.

For protected API calls, use a real JWT from Google login or the current team-approved auth flow.

## 1. Startup And Health

- [ ] Backend starts with valid config.
- [ ] Backend fails fast with a clear startup error when `Jwt__SigningKey` is missing.
- [ ] Backend fails fast with a clear startup error when `ConnectionStrings__Postgres` is missing.
- [ ] `GET /health/live` returns 200.
- [ ] `GET /health/ready` returns 200 when PostgreSQL is reachable.
- [ ] `GET /api/health` returns 200.
- [ ] `GET /api/health/db` returns 200 when PostgreSQL is reachable.
- [ ] `GET /health/ready` fails when PostgreSQL is intentionally unavailable.

Expected result: deploy/runtime failures are visible before users hit feature APIs.

## 2. Workspace And Role Baseline

- [ ] Owner can create/list/get/update/delete their workspace.
- [ ] Owner can add editor/viewer members.
- [ ] Owner can create a pending workspace invitation for an existing registered user.
- [ ] Owner cannot invite an unknown email.
- [ ] Pending invitation does not create an active workspace member until accepted.
- [ ] Invited user can list their pending invitations.
- [ ] Invited user can accept and become an active workspace member.
- [ ] Invited user can decline without becoming a workspace member.
- [ ] A different user cannot view, accept, or decline another user's invitation.
- [ ] Expired invitation cannot be accepted.
- [ ] Owner can update member role/status.
- [ ] Owner cannot remove the last owner if the service rejects that business case.
- [ ] Editor can view workspace shell and workspace resources.
- [ ] Viewer can view workspace shell and read allowed resources.
- [ ] Invited/inactive members cannot access folders, documents, reports, chunks, or AI flows.
- [ ] System admin cannot access workspace content APIs just because they are an admin.

Expected result: feature tests below have reliable owner/editor/viewer/admin accounts.

## 3. Folder Rules

- [ ] Owner can create root folder.
- [ ] Owner can create nested folder.
- [ ] Editor can create/update/delete folders if current business rules allow editor folder management.
- [ ] Viewer cannot create/update/delete folders.
- [ ] Duplicate active sibling folder name returns conflict.
- [ ] Same folder name is allowed after the old sibling is soft-deleted.
- [ ] Deleting a parent folder soft-deletes active child folders.
- [ ] `DELETE /api/folders/{folderId}?documentDeleteMode=cascade_to_trash` moves contained documents to Trash with the folder tree.
- [ ] `DELETE /api/folders/{folderId}?documentDeleteMode=move_documents_to_trash` moves contained documents to Trash and detaches them from the deleted folder tree.
- [ ] Normal folder list excludes soft-deleted folders.

Expected result: folder tree behavior matches the current business rule and does not expose deleted records in normal list APIs.

## 4. Presigned Upload And Processing

- [ ] Owner can call `POST /api/workspaces/{workspaceId}/documents/presign-upload`.
- [ ] Editor can call presign upload if the editor is an active member.
- [ ] Viewer cannot call presign upload.
- [ ] Presign response includes `documentId`, `uploadUrl`, `requiredHeaders`, and pending upload metadata.
- [ ] Browser/client can `PUT` the file to MinIO using the returned URL and exact headers.
- [ ] The user who started upload can call `POST /api/documents/{documentId}/confirm-upload`.
- [ ] Workspace owner can confirm upload started by another user.
- [ ] Other editor cannot confirm another editor's pending upload.
- [ ] Confirm upload validates the object exists in MinIO.
- [ ] Confirm upload creates a `process_document` AI job.
- [ ] RabbitMQ worker processes the job.
- [ ] Document moves through `pending_upload` -> `uploaded` or `processing` -> `completed`.
- [ ] Failed processing marks document/job as `failed` with a useful error payload.
- [ ] Normal document list excludes Trash/soft-deleted documents.
- [ ] Document search/filter by folder/status/query behaves as expected.

Expected result: backend owns object key, metadata, permission checks, job creation, and status transitions.

## 5. Trash, Restore, Hard Delete, Retention

- [ ] Owner can list all Trash documents in the workspace.
- [ ] Editor can list only Trash documents they uploaded.
- [ ] Viewer cannot list Trash documents.
- [ ] Owner can soft-delete any document in the workspace.
- [ ] Editor can soft-delete only their own uploaded document.
- [ ] Viewer cannot soft-delete documents.
- [ ] Restore succeeds when the original folder is active and no filename conflict exists.
- [ ] Restore fails clearly when the original folder is deleted/unavailable.
- [ ] Restore fails clearly when an active document with the same filename already exists in that folder.
- [ ] Owner can hard-delete any Trash document.
- [ ] Editor can hard-delete only their own Trash document.
- [ ] Viewer cannot hard-delete documents.
- [ ] Hard delete removes document metadata, chunks, and MinIO object.
- [ ] Historical chat/source rows, if seeded, do not block hard delete because document references are nullable.
- [ ] Trash cleanup worker hard-deletes Trash documents older than `TrashCleanup:DocumentRetentionDays`.
- [ ] Recent Trash documents are not purged by the cleanup worker.

Expected result: Trash is reversible before purge, and purge does not leave storage/database leftovers.

## 6. AI Jobs API

- [ ] Owner/editor/viewer can list jobs for a workspace they can view.
- [ ] Non-member cannot list workspace jobs.
- [ ] `GET /api/ai-jobs/{jobId}` returns job details only to an allowed workspace user.
- [ ] Retry is allowed only for failed `process_document`, `generate_report`, and `compare_documents` jobs.
- [ ] Retry republishes the correct RabbitMQ queue message.
- [ ] Retry is rejected for queued/running/completed jobs.
- [ ] Retry is rejected for unsupported job types.
- [ ] Admin job listing does not expose document content, report markdown, chunk content, snippets, or user questions.

Expected result: `ai_jobs` remains the source of truth for frontend polling and admin monitoring.

## 7. Reports And Compare Async Flow

- [ ] Owner can call `POST /api/workspaces/{workspaceId}/reports/generate`.
- [ ] Editor can generate report if active in the workspace.
- [ ] Viewer cannot generate report.
- [ ] Report generation rejects deleted/incomplete/source documents outside the workspace.
- [ ] Folder-scope report resolves active subtree documents only.
- [ ] Generate report returns 202 with an `AiJobDto`.
- [ ] Worker calls AI service `/generate-report`.
- [ ] Completed job persists a report with markdown content and source document metadata.
- [ ] Sending an existing `reportGroupId` for the same report type creates the next `versionNumber`.
- [ ] Sending a missing, deleted, cross-workspace, or mismatched-type `reportGroupId` fails clearly.
- [ ] Owner/editor can call `POST /api/workspaces/{workspaceId}/compare`.
- [ ] Viewer cannot compare documents.
- [ ] Compare rejects fewer than two valid source documents.
- [ ] Compare rejects deleted/incomplete/source documents outside the workspace.
- [ ] Compare returns 202 with an `AiJobDto`.
- [ ] Worker calls AI service `/compare`.
- [ ] Completed compare persists a `comparison_report`.
- [ ] Sending an existing comparison `reportGroupId` creates the next comparison report version.
- [ ] `GET /api/workspaces/{workspaceId}/reports?type=` lists readable reports.
- [ ] `GET /api/reports/{reportId}` returns detail only to allowed workspace users.
- [ ] Only owner can delete reports.

Expected result: compare/report are async, backend persists reports, and AI service does not write the `reports` table.

## 8. Dashboard And Admin Monitoring

- [ ] `GET /api/dashboard/me` works for active non-admin users.
- [ ] User dashboard returns aggregate counts and recent jobs only.
- [ ] User dashboard does not include document content, chunks, report markdown, chat messages, snippets, or user questions.
- [ ] `GET /api/dashboard/me` works for active system admin.
- [ ] Admin dashboard scope is system metadata only.
- [ ] `GET /api/admin/users` requires system admin.
- [ ] `PATCH /api/admin/users/{userId}` requires system admin.
- [ ] Admin cannot deactivate/demote themselves.
- [ ] Admin cannot deactivate/demote the last active admin.
- [ ] `GET /api/admin/ai-jobs` requires system admin.
- [ ] Admin APIs do not expose workspace content.

Expected result: admin observes and manages system metadata without gaining workspace-content access.

## 9. Boundary And Security Regression Pass

- [ ] Frontend never calls AI service directly for backend-owned flows.
- [ ] Backend checks permissions before calling AI service.
- [ ] Soft-deleted documents are excluded from normal list APIs.
- [ ] Soft-deleted documents are excluded from compare/report source resolution.
- [ ] Soft-deleted documents are excluded from RAG retrieval once Chat/RAG backend exists.
- [ ] Error responses use shared `ApiErrorDto` shape for expected business failures.
- [ ] No real secrets are committed in `appsettings.json`, `appsettings.Development.json`, `.env`, or CI files.
- [ ] Docker compose uses local `.env` values for secrets.
- [ ] Backend Docker image builds successfully.

Expected result: the MVP flows respect backend ownership, authorization, and data privacy boundaries.

## Final Acceptance Summary

Mark the backend MVP manual pass complete only when:

- All implemented backend sections above pass.
- Any intentionally skipped item is linked to an issue/PR owner.
- Chat/RAG API gap is either implemented or explicitly accepted as not owned by this backend task.
- CI is green on the PR branch.
