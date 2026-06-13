# Backend Tasks For Thinh

This file tracks the remaining backend work for Thinh, based on the current codebase and the project docs. Treat code and migrations as the source of truth for implementation status; use the docs below for business rules and contracts.

## Sources Checked

- `plan.md`
- `docs/about-project/CURRENT_PROJECT_CONTEXT_FOR_BUSINESS_RULE_REVIEW.md`
- `docs/frontend-docs/API_CONTRACT_MVP.md`
- `docs/backend/BE_AI_BOUNDARY_CONTRACT.md`
- `docs/backend/BACKEND_STRUCTURE_GUIDE.md`
- `docs/backend/DATABASE_SCHEMA.md`
- `backend/InsightVault.API/Controllers`
- `backend/InsightVault.API/Application/Services`
- `backend/InsightVault.API/Application/Abstractions/Services`
- `backend/InsightVault.API/Application/Abstractions/Ai/IAiServiceClient.cs`
- `backend/InsightVault.API/Infrastructure/Ai/AiServiceClient.cs`
- `backend/InsightVault.API/DTOs/Chat`
- `backend/InsightVault.API/Domain/Entities`

## Current Backend Status

Done in Thinh's main ownership area:

- Auth APIs exist: `POST /api/auth/google`, `GET /api/auth/me`, `POST /api/auth/logout`.
- Workspace APIs exist: list/create/get/update/delete workspace.
- Workspace member APIs exist: list/add/update/remove members.
- `IWorkspacePermissionService` centralizes owner/editor/viewer checks.
- System Admin is blocked from workspace content through workspace permission checks.
- Invite logic currently allows unknown email as `Invited`; login with the same email activates that membership.

Done outside Thinh's original ownership, but important for integration:

- Folder/document/upload/trash APIs exist.
- AI jobs APIs exist.
- Reports/compare APIs exist.
- Dashboard/admin APIs exist.
- `AiServiceClient` supports `/process-document`, `/generate-report`, `/compare`, and `/rag/query`.

Chat/RAG implemented in backend:

- `ChatController` exists and exposes the MVP chat routes from the API contract.
- `IChatService` and `ChatService` exist in the pre-created chat folders.
- `IAiServiceClient.QueryRagAsync` exists and calls AI `POST /rag/query`.
- Backend uses the existing chat DTOs/domain/schema; no duplicate chat DTO/entity/table/migration was added.
- Frontend already has `frontend/src/api/chatApi.ts` and hooks calling the target chat endpoints.
- Frontend MSW still has chat mocks and can be removed/switched later when the frontend team wires to real backend.

Still remaining:

- Run Postman/manual integration against real Postgres + AI service to verify end-to-end RAG answers and source citations.
- Add deeper integration tests for chat permissions once the test setup can cover pgvector-backed DbContext behavior.
- Review frontend MSW usage before demo so real backend chat endpoints are used where intended.

## Architecture Rules To Follow

- Keep controllers thin: HTTP input -> service call -> response.
- Put business rules in application services.
- Use DTOs as the public API contract; do not return EF entities.
- Use `IWorkspacePermissionService` for workspace access checks.
- Repositories should contain business queries and must not call `SaveChangesAsync`.
- Application services coordinate repositories, AI/storage clients, and commit with `SaveChangesAsync`.
- Backend is the system-of-record for auth, permission, chat persistence, source resolution, and report persistence.
- AI service must not be called directly by frontend and must not decide permissions.

## Business Rules To Preserve

- Business APIs require JWT except documented public APIs.
- Workspace content access requires active membership.
- System Admin cannot access workspace/folder/document/chunk/chat/report content, even if the admin account appears as a workspace member.
- Owner can manage workspace/member/content.
- Editor can mutate content but cannot manage members.
- Viewer can read workspace resources and use RAG chat, but cannot upload, compare, generate reports, delete/restore/hard-delete, or download original files in MVP.
- Invited/removed members cannot access workspace content.
- Folder is not a permission boundary; folder permissions come from workspace role.
- Soft-deleted folders/documents must be excluded from normal lists, source resolution, compare/report resolution, and RAG retrieval.
- Only completed, non-deleted documents can be used for RAG.
- RAG chat must not create `AiJob`.
- Web search is not in MVP; keep request fields ignored/disabled.

## Priority 1: Implement Chat/RAG Backend API

Status: implemented in backend.

Created:

- `backend/InsightVault.API/Controllers/ChatController.cs`
- `backend/InsightVault.API/Application/Abstractions/Services/Chat/IChatService.cs`
- `backend/InsightVault.API/Application/Services/Chat/ChatService.cs`

Do not create duplicate folders or duplicate contracts:

- Use the existing `Application/Services/Chat` and `Application/Abstractions/Services/Chat` folders.
- Use the existing `DTOs/Chat` request/response records.
- Use the existing `Domain/Entities` chat entities.
- Use the existing `Data/InsightVaultDbContext.cs` chat DbSets and schema.
- Do not add a new `Chats` folder, duplicate DTOs, or duplicate entities.
- Do not add a migration for basic Chat/RAG; the required chat tables already exist.
- For v1, use `InsightVaultDbContext` inside `ChatService`, following the current `ReportService`/`AiJobService` pattern for feature-specific queries. Add a `ChatRepository` only later if chat queries are reused by more than one service.
- Add a small internal mapper/helper in `ChatService` or `Application/Services/Chat` if needed; do not expose EF entities from controllers.

Registered:

- `IChatService` in `backend/InsightVault.API/Application/DependencyInjection.cs`.
- Any new repository in `backend/InsightVault.API/Infrastructure/DependencyInjection.cs`.

Implemented frontend-facing endpoints:

- `GET /api/workspaces/{workspaceId}/chat-sessions`
- `POST /api/workspaces/{workspaceId}/chat-sessions`
- `GET /api/chat-sessions/{sessionId}/messages`
- `POST /api/chat-sessions/{sessionId}/messages`
- `DELETE /api/chat-sessions/{sessionId}`

These routes must match `frontend/src/api/chatApi.ts` exactly. Backend responses must follow `docs/frontend-docs/API_CONTRACT_MVP.md`, not the temporary MSW mock response shape.

Use existing DTOs:

- `CreateChatSessionRequest`
- `ChatSessionDto`
- `SendChatMessageRequest`
- `ChatMessageDto`
- `ChatTurnResponse`
- `ChatSourceDto`
- `WebSourceDto`

Required behavior:

- List sessions only for the current user's active membership in the workspace.
- Sessions are private to `created_by_id`; users cannot list/read/delete another user's session.
- Viewer can create sessions and send messages.
- Admin cannot use chat content APIs.
- Delete chat session should soft delete by setting `DeletedAt`.
- Sending a message saves the user message, contexts, assistant message, and sources.
- Message contexts apply only to the current message.
- Client-provided labels/paths are display hints only; backend must trust IDs after validation.
- Context resources must belong to the chat session workspace.
- Folder contexts include subfolders by default unless `includeSubfolders = false`.
- Resolve contexts to deduplicated explicit document IDs before calling AI.
- If no contexts are provided, call AI with workspace scope.
- If document/folder contexts are provided, call AI with document scope and explicit document IDs.
- Reject contexts that resolve to deleted, incomplete, or cross-workspace documents.
- Preserve historical chat source/context snapshots when documents are later hard-deleted.
- `CreateChatSessionRequest.WebSearchEnabled`, `WebSearchProvider`, and message `WebSearchOptions` are contract placeholders only. Do not add DB columns or enable web search. Normalize responses to `WebSearchEnabled = false` and `WebSearchProvider = null`.
- `ChatSourceDto.DocumentId` is nullable in the backend/API contract so historical citations can survive document hard delete. If a frontend local type disagrees, backend still follows the official API contract.

Recommended `IChatService` surface:

```csharp
Task<IReadOnlyList<ChatSessionDto>> ListSessionsAsync(
    Guid workspaceId,
    CancellationToken cancellationToken = default);

Task<ChatSessionDto> CreateSessionAsync(
    Guid workspaceId,
    CreateChatSessionRequest request,
    CancellationToken cancellationToken = default);

Task<IReadOnlyList<ChatMessageDto>> ListMessagesAsync(
    Guid sessionId,
    CancellationToken cancellationToken = default);

Task<ChatTurnResponse> SendMessageAsync(
    Guid sessionId,
    SendChatMessageRequest request,
    CancellationToken cancellationToken = default);

Task DeleteSessionAsync(
    Guid sessionId,
    CancellationToken cancellationToken = default);
```

Controller style:

- Mark controller `[ApiController]` and `[Authorize]`.
- Follow existing route style used by `ReportsController`/`AiJobsController`, for example method-level routes like `api/workspaces/{workspaceId:guid}/chat-sessions`.
- Let services throw `ApiException`; do not add large `try/catch` blocks in the controller.

## Priority 2: Add Backend-To-AI RAG Client

Status: implemented in backend.

Updated:

- `backend/InsightVault.API/Application/Abstractions/Ai/IAiServiceClient.cs`
- `backend/InsightVault.API/Infrastructure/Ai/AiServiceClient.cs`

Add method:

```csharp
Task<RagQueryResult> QueryRagAsync(
    RagQueryAiRequest request,
    CancellationToken cancellationToken = default);
```

AI endpoint:

- `POST /rag/query`

AI request shape:

```json
{
  "question": "string",
  "workspace_id": "uuid",
  "scope": "workspace|document|folder",
  "folder_id": "uuid-or-null",
  "document_ids": ["uuid"],
  "top_k": 5,
  "chat_history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "web_search_options": {
    "enabled": false,
    "provider": null,
    "max_results": 5
  }
}
```

AI response shape:

```json
{
  "answer": "Markdown answer",
  "sources": [
    {
      "chunk_id": "uuid",
      "document_id": "uuid",
      "file_name": "Requirement.docx",
      "snippet": "...",
      "similarity": 0.82,
      "retrieval_debug": {}
    }
  ],
  "web_sources": []
}
```

Mapping rules:

- No context -> `scope = "workspace"`, `folder_id = null`, `document_ids = null`.
- File context -> `scope = "document"`, `document_ids = resolved file IDs`.
- Folder context -> `scope = "document"`, `document_ids = resolved document IDs under folder tree`.
- Compatibility `scope = "folder"` may exist in AI, but new backend chat flow should prefer explicit document IDs.

Use existing `IAiServiceClient` and `AiServiceClient`; do not create a separate AI HTTP client for RAG.

Define request/result records in `IAiServiceClient.cs` near the existing report/compare records unless they become too large. Keep JSON serialization details inside `AiServiceClient`.

Minimum records:

- `RagQueryAiRequest`
- `RagChatHistoryMessage`
- `RagQueryResult`
- `RagSourceResult`
- optional `RagRetrievalDebug` or raw metadata object for source metadata

Persist retrieval debug in `ChatMessageSource.Metadata` as JSON when the AI returns it. If no debug object is returned, use `{}`.

## Priority 3: Chat Persistence Details

Use current schema:

- `chat_sessions`
- `chat_messages`
- `chat_message_contexts`
- `chat_message_sources`

Do not create new chat tables for this task.

Important schema rules:

- `chat_sessions.workspace_id` is the tenant boundary.
- `chat_messages.workspace_id` must match the session workspace.
- `chat_message_contexts.workspace_id` must match the parent message workspace.
- `chat_message_contexts.context_type` is `Folder` or `Document`.
- For folder context, `document_id` must be null.
- For document context, `folder_id` must be null.
- `context_display_name` and `context_path` are snapshots for readable history after rename/delete.
- `chat_message_sources.document_id` is nullable to preserve historical citations after hard delete.

When saving a turn:

1. Validate session exists, not deleted, belongs to current user, and current user can view workspace.
2. Validate message content is not empty.
3. Validate/resolve contexts.
4. Save user message and message contexts.
5. Build chat history from prior messages in the same private session.
6. Call AI `/rag/query`.
7. Save assistant message.
8. Save sources on assistant message.
9. Return `ChatTurnResponse`.

Use existing repositories where they already fit:

- Use `IWorkspacePermissionService.EnsureCanViewWorkspaceAsync` for chat read/create/send/delete checks.
- Use `IFolderRepository.GetByIdInWorkspaceAsync` to validate a folder context root.
- Use `IFolderRepository.ListActiveByWorkspaceAsync` to compute folder subtree IDs.
- Use `IDocumentRepository.ListCompletedByIdsAsync` for explicit document contexts.
- Use `IDocumentRepository.ListActiveByFolderIdsAsync`, then filter to completed documents for folder contexts.
- If no contexts are provided, do not resolve every document in backend; call AI with workspace scope and rely on AI retrieval filtering, while backend has already authorized workspace access.

Folder subtree behavior:

- Reuse the folder-tree traversal pattern already present in `ReportService`.
- Include the selected folder itself.
- Include child folders recursively by default.
- If `includeSubfolders = false`, include only the selected folder.

Validation/error behavior:

- Empty or whitespace message content -> `400`, error code like `chat.empty_message`.
- Missing/deleted/private session -> `404`, error code `chat.session_not_found`.
- Session owned by another user -> return `404` rather than leaking existence.
- Cross-workspace context -> `404`/`409`, do not call AI.
- Context shape mismatch, such as `folder` with `documentId`, -> `400`.
- Contexts resolving to no completed active documents -> `409`, error code `chat.no_completed_documents`.
- AI failure should surface as expected API error or fail the request; do not create an `AiJob`.

## Priority 4: Permission Hardening Review

After Chat/RAG works, review these areas for permission consistency:

- Folder service uses workspace role checks and excludes deleted folders.
- Document service excludes deleted documents and uses owner/editor uploaded-by rules for trash.
- Report service blocks viewer generation/deletion and only owner deletes reports.
- AI job service lets owner/editor/viewer view jobs but only owner/editor retry supported failed jobs.
- Dashboard/admin do not expose workspace content, snippets, report markdown, or chat questions.
- Admin cannot access workspace content APIs.

Double-check before implementation:

- `IWorkspacePermissionService.GetUserRoleAsync` only returns a role for active non-admin users.
- `EnsureCanViewWorkspaceAsync` is enough for owner/editor/viewer chat access and still blocks admin/invited/removed users.
- Do not bypass permission by checking `workspace.OwnerId` directly inside chat code.
- Do not trust frontend-selected `workspaceId`, `folderId`, or `documentId` until validated against database ownership.

## Priority 5: Tests Or Manual Verification

Automated tests are currently thin. Existing test project passes but does not deeply cover Auth/Workspace/Chat.

Current automated coverage added for this task:

- `AiServiceClientTests.QueryRagAsync_posts_contract_payload_and_maps_response` verifies backend-to-AI `/rag/query` path, JSON payload shape, disabled web search options, and source response mapping.

Note: direct `ChatService` EF InMemory tests are blocked by the existing `DocumentChunk.Embedding` pgvector mapping. Prefer Postgres-backed integration tests or a dedicated test DbContext strategy before adding deep ChatService persistence tests.

Recommended automated tests later:

- Chat session create/list is allowed for owner/editor/viewer active members.
- Admin cannot create/list chat sessions.
- Invited/removed/non-member cannot create/list chat sessions.
- User cannot access another user's private chat session.
- Sending message with cross-workspace document/folder context fails.
- Sending message with incomplete/deleted document context fails.
- Sending message does not create `AiJob`.

Manual/Postman checks for Thinh:

- Owner creates workspace.
- Owner invites member.
- Viewer can create chat session and ask RAG.
- Viewer cannot upload/compare/generate report/delete.
- Admin cannot access workspace chat.
- Chat without context asks workspace scope.
- Chat with document context asks only selected completed document.
- Chat with folder context includes subfolders by default.

Contract checks:

- `GET /api/workspaces/{workspaceId}/chat-sessions` returns `ChatSessionDto[]`.
- `POST /api/workspaces/{workspaceId}/chat-sessions` returns `ChatSessionDto`.
- `GET /api/chat-sessions/{sessionId}/messages` returns `ChatMessageDto[]`.
- `POST /api/chat-sessions/{sessionId}/messages` returns `ChatTurnResponse`.
- `DELETE /api/chat-sessions/{sessionId}` returns `204 No Content`.
- No chat endpoint creates `AiJob`.

Run before handing off:

```powershell
dotnet test backend\InsightVault.API.Tests\InsightVault.API.Tests.csproj
```

If the local dev server is needed:

```powershell
.\scripts\start-dev.ps1
```

Do not use `docker compose down -v` unless local data deletion is explicitly intended.

## Deferred For Later

These are not blockers for Chat/RAG:

- GitHub-style invite accept/deny email flow.
- Owner transfer.
- Virus/malware scanning.
- Restricted AI database user.
- Viewer original-file download.
- Web search.
- Export PDF/DOCX.
