# Plan Backend Cho Thịnh

Tài liệu này là plan chính thức cho phần backend của Thịnh trong dự án
InsightVault AI. Nội dung được tổng hợp từ `docs/`, code hiện tại trong
`backend/InsightVault.API`, và test project, không chỉ copy lại docs cũ.

Mục tiêu của file này:

- Làm rõ phần Thịnh đã làm.
- Làm rõ task backend còn lại của Thịnh hoặc cần Thịnh review.
- Ghi lại business rule quan trọng để tránh implement sai permission.
- Ghi lại cấu trúc tổ chức code backend cần bám.
- Ghi rõ điểm nào là kết luận từ việc đối chiếu code/docs bằng `^[inferred]`.

## 1. Nguồn Đã Đọc Và Đối Chiếu

Nguồn docs chính:

- `docs/about-project/CURRENT_PROJECT_CONTEXT_FOR_BUSINESS_RULE_REVIEW.md`
- `docs/about-project/PROJECT_FEATURES_MVP.md`
- `docs/about-project/PROJECT_PLAN_MVP_BUILD.md`
- `docs/about-project/TEAM_EXECUTION_ARCHITECTURE_PLAN.md`
- `docs/backend/BACKEND_STRUCTURE_GUIDE.md`
- `docs/backend/BE_AI_BOUNDARY_CONTRACT.md`
- `docs/backend/BACKEND_MVP_MANUAL_TEST_CHECKLIST.md`
- `docs/frontend-docs/API_CONTRACT_MVP.md`

Nguồn code đã đối chiếu:

- `backend/InsightVault.API/Controllers`
- `backend/InsightVault.API/Application/Services`
- `backend/InsightVault.API/Application/Abstractions/Services`
- `backend/InsightVault.API/Infrastructure/Auth`
- `backend/InsightVault.API/Infrastructure/Ai`
- `backend/InsightVault.API/Data`
- `backend/InsightVault.API.Tests`

Khi docs cũ và code hiện tại khác nhau, ưu tiên code hiện tại để xác định trạng
thái đã/chưa làm, sau đó dùng docs mới nhất để xác định business rule.

## 2. Tổng Quan Dự Án

InsightVault AI là collaborative document intelligence workspace cho nhóm project.

Luồng giá trị MVP:

```text
Login -> Shared workspace -> Invite member -> Upload documents
-> Process/chunk/embed -> Summary -> RAG chat
-> Compare/gap detection -> Generate Markdown report -> Admin monitoring
```

Ba lớp giá trị chính:

- Shared document workspace: workspace, member, folder, document.
- AI document understanding: extract, chunk, embed, summary, RAG.
- Insight generation: compare, gap/conflict detection, Markdown report.

Tech stack chính:

- Frontend: React/Vite.
- Backend: ASP.NET Core Web API.
- Database: PostgreSQL + pgvector.
- Storage: MinIO.
- Queue/background: RabbitMQ + `.NET BackgroundService` + `ai_jobs`.
- AI service: Python FastAPI.
- AI provider: Gemini.

## 3. Backend Là System-Of-Record

Backend là nơi sở hữu business state và permission.

Backend chịu trách nhiệm:

- Authentication và current user.
- JWT authorization.
- Workspace role và permission.
- Workspace/member/folder/document metadata.
- MinIO upload orchestration.
- AI job lifecycle.
- Chat/report persistence.
- Resolve `@file` và `@folder` trước khi gọi AI.
- Persist report và report version.

AI service chịu trách nhiệm:

- Text extraction.
- Chunking.
- Embedding.
- Vector search.
- Prompt/Gemini calls.
- RAG answer.
- Compare/report generation internals.

Business boundary bắt buộc:

- Frontend chỉ gọi Backend API.
- Frontend không gọi AI service trực tiếp.
- AI service không quyết định permission.
- AI service không persist report.
- Backend kiểm tra permission trước khi gọi AI.

## 4. Cấu Trúc Code Backend Cần Bám

Dependency direction:

```text
Controllers
  -> Application service interfaces
  -> Application services
  -> Repository interfaces
  -> Repository implementations
  -> DbContext
```

Quy tắc tổ chức:

- `Controllers`: controller mỏng, nhận HTTP input, gọi service, trả response.
- `DTOs`: public API contract giữa frontend và backend; không expose EF entity.
- `Application/Abstractions/Services`: service interface theo feature.
- `Application/Services`: business/use-case logic.
- `Application/Abstractions/Repositories`: repository contracts.
- `Infrastructure/Persistence/Repositories`: EF Core repository implementations.
- `Infrastructure/Auth`: JWT, Google OAuth, current user.
- `Infrastructure/Ai`: HTTP client gọi Python AI service.
- `Infrastructure/BackgroundJobs`: worker xử lý job dài.
- `Data`: DbContext, migrations.
- `Common/Errors`: `ApiException` và middleware/error helpers.

Quy tắc implementation:

- Business rule không đặt trong controller nếu có thể đưa vào service.
- Repository không gọi `SaveChangesAsync`; service commit một use case.
- Permission phải dùng `IWorkspacePermissionService`.
- Error expected nên dùng `ApiException`/`ApiErrorDto`.
- Không thêm logic cho AI permission ở AI service.

## 5. Ownership Của Thịnh

Phạm vi chính của Thịnh:

- Auth.
- Current user.
- JWT.
- Google OAuth.
- User/admin role foundation.
- Workspace CRUD.
- Workspace member invite/list/update/remove.
- Workspace role/permission service.

Các vùng code Thịnh sở hữu chính:

```text
backend/InsightVault.API/Controllers/AuthController.cs
backend/InsightVault.API/Controllers/WorkspacesController.cs
backend/InsightVault.API/DTOs/Auth/
backend/InsightVault.API/DTOs/Workspaces/
backend/InsightVault.API/Application/Abstractions/Services/Auth/
backend/InsightVault.API/Application/Abstractions/Services/Workspaces/
backend/InsightVault.API/Application/Services/Auth/
backend/InsightVault.API/Application/Services/Workspaces/
backend/InsightVault.API/Infrastructure/Auth/
```

Phần Thịnh cần phối hợp/review:

- Permission cho folder/document/upload/trash.
- Permission cho AI jobs.
- Permission cho compare/report.
- Permission cho dashboard/admin để không lộ workspace content.
- Contract chat/RAG nếu Thịnh nhận task Chat API.

Phần không phải ownership chính của Thịnh:

- MinIO storage internals.
- Document processing worker.
- RabbitMQ publisher/consumer internals.
- Python AI service.
- Chunking/embedding/vector search.
- Prompt/Gemini internals.
- Frontend UI.

## 6. Business Rule Bắt Buộc

### System Role

- `User`: dùng các chức năng chính.
- `Admin`: quản lý user/system/job monitoring.

Admin rule:

- System Admin không được truy cập workspace content.
- Admin không được xem folder/document/chunks/chat/report content của user.
- Admin API chỉ trả metadata cần cho monitoring.
- Nếu admin cũng là workspace member thì vẫn không được dùng content API theo rule hiện tại.

### Workspace Role

- `Owner`: quản lý workspace, member, content, trash, report.
- `Editor`: mutate content như folder/document/upload, được compare/generate report, nhưng không quản lý member.
- `Viewer`: đọc workspace resources và được RAG chat, nhưng không upload, compare, generate report, delete, hard delete, restore hoặc download original file trong MVP.

Member status:

- `Invited`
- `Active`
- `Removed`

Permission rule:

- Business API cần JWT.
- Workspace content access phải dựa trên active `workspace_members`.
- Invited member chỉ thấy invitation/workspace shell, không thấy content.
- Removed member không còn access.
- Owner transfer để phase sau.

### Folder Và Document

- Folder chỉ là cách phân loại document trong workspace, không phải permission boundary riêng.
- Folder permission vẫn theo workspace role.
- Folder soft delete phải ẩn khỏi list thường.
- Soft-deleted document vào Trash, chưa xóa MinIO object ngay.
- Soft-deleted document/chunk phải bị loại khỏi normal list, mention resolution, compare/report source resolution, RAG retrieval.
- Hard delete từ Trash mới xóa metadata, chunks và MinIO object.
- Owner delete/restore/hard delete mọi document trong workspace.
- Editor chỉ delete/restore/hard delete document do chính editor đó upload.
- Viewer không delete/restore/hard delete.

### Chat/RAG

- Chat session thuộc workspace và private theo user.
- Message không có context thì RAG trên toàn workspace readable documents.
- `@file` resolve thành document IDs cụ thể.
- `@folder` resolve folder và subfolders thành document IDs, mặc định include subfolders.
- Chỉ document `Completed` và chưa soft delete mới dùng cho RAG.
- Viewer được tạo chat session và hỏi RAG.
- RAG chat không tạo `AiJob`.
- Web search chưa thuộc MVP; contract có thể giữ placeholder nhưng backend/AI nên ignore/disable.

### Compare/Report

- Compare là user-triggered, không tự chạy sau upload.
- Compare/report chạy async qua `ai_jobs`.
- Owner/editor được compare và generate report.
- Viewer chỉ đọc report đã có, không generate/delete report.
- Chỉ owner được delete report.
- Backend persist report và report version.
- AI service không tự ghi bảng `reports`.

## 7. Trạng Thái Code Hiện Tại

Các controller hiện có trong code:

```text
AdminController.cs
AiJobsController.cs
AuthController.cs
DashboardController.cs
DocumentsController.cs
FoldersController.cs
HealthController.cs
MetaController.cs
ReportsController.cs
WorkspacesController.cs
```

Điểm cần lưu ý:

- Một số docs cũ từng ghi `AiJobsController`, `ReportsController`, `AdminController` chưa có.
- Code hiện tại đã có các controller này, cộng thêm `DashboardController`.
- Code hiện tại chưa có `ChatController`.
- `Application/Services/Chat` và `Application/Abstractions/Services/Chat` hiện chỉ có `.gitkeep`.
- DTO/domain/migration cho chat đã có, nhưng API layer/service/repository flow cho chat chưa có.
- `AiServiceClient` hiện có `ProcessDocumentAsync`, `GenerateReportAsync`, `CompareDocumentsAsync`, nhưng chưa có `QueryRagAsync` gọi `/rag/query`.

Các điểm trên là kết luận từ đối chiếu code hiện tại với docs. ^[inferred]

## 8. Task Thịnh Đã Làm

### Auth APIs

Đã có:

- `POST /api/auth/google`
- `GET /api/auth/me`
- `POST /api/auth/logout`

Auth internals đã có:

- Google token verifier wiring.
- JWT issuer/validation.
- Current user service.
- Inactive user bị chặn.
- Login Google activate invited memberships theo email.
- Stateless logout trả `204 No Content`.

### Workspace APIs

Đã có:

- `GET /api/workspaces?q=`
- `POST /api/workspaces`
- `GET /api/workspaces/{workspaceId}`
- `PATCH /api/workspaces/{workspaceId}`
- `DELETE /api/workspaces/{workspaceId}`

Workspace behavior đã có:

- Creator trở thành owner.
- Tạo owner membership active.
- Workspace soft delete.
- List workspace theo active membership.
- Admin bị chặn tạo/truy cập workspace content qua service/permission path hiện tại.

### Workspace Member APIs

Đã có:

- `GET /api/workspaces/{workspaceId}/members`
- `POST /api/workspaces/{workspaceId}/members`
- `PATCH /api/workspaces/{workspaceId}/members/{memberId}`
- `DELETE /api/workspaces/{workspaceId}/members/{memberId}`

Member behavior đã có:

- Normalize email bằng trim/lowercase.
- Existing user được add thành active member.
- Unknown email được add thành invited member.
- Removed member có thể invite lại.
- Không hạ role owner cuối cùng.
- Không remove owner cuối cùng.
- Không activate invited member chưa có user account.

### Permission Foundation

Đã có `IWorkspacePermissionService` với các nhóm check chính:

- Get role/current active membership.
- Read/view workspace.
- Manage workspace.
- Manage members.
- Mutate workspace content.
- Manage folders.
- Manage documents.
- Delete document theo owner/editor uploaded-by rule.

Permission đã được dùng ở nhiều service khác:

- Folder service.
- Document service.
- Report service.
- AI job service. ^[inferred]

### Backend Đã Mở Rộng Ngoài Phần Thịnh Ban Đầu

Codebase hiện đã có các phần sau:

- Folder/document/upload/trash services/controllers.
- AI job list/detail/retry service/controller.
- Report/compare service/controller.
- Dashboard service/controller.
- Admin service/controller.
- `DocumentProcessingWorker`, `AiJobWorker`, `TrashCleanupWorker`.
- AI client cho process document, generate report, compare documents.

Điều này nghĩa là plan cũ chỉ nói Auth/Workspace chưa còn đủ để phản ánh repo hiện tại. ^[inferred]

## 9. Task Còn Lại Của Thịnh

### Ưu Tiên 1: Chat/RAG Backend API

Chat/RAG là gap backend rõ nhất hiện tại.

Cần implement:

- `ChatController`.
- `IChatService`.
- `ChatService`.
- Repository/query cần thiết cho:
  - `ChatSession`
  - `ChatMessage`
  - `ChatMessageContext`
  - `ChatMessageSource`
- `IAiServiceClient.QueryRagAsync`.
- Mapping request/response tới AI endpoint `/rag/query`.

Endpoints cần có:

- `GET /api/workspaces/{workspaceId}/chat-sessions`
- `POST /api/workspaces/{workspaceId}/chat-sessions`
- `GET /api/chat-sessions/{sessionId}/messages`
- `POST /api/chat-sessions/{sessionId}/messages`
- `DELETE /api/chat-sessions/{sessionId}`

Business rules phải enforce:

- Session private theo `created_by_id`.
- Owner/editor/viewer active đều được tạo và dùng chat.
- Admin không được dùng chat content API.
- Context `folder/document` phải thuộc cùng workspace với session.
- Client labels/path chỉ là display hint; backend trust IDs sau permission check.
- Folder context include subfolders mặc định.
- Resolve context thành deduplicated explicit `document_ids`.
- Chỉ resolve completed, non-deleted documents.
- RAG chat không tạo `AiJob`.
- Lưu user message.
- Lưu assistant message.
- Lưu message contexts.
- Lưu citation sources.
- Nếu source document bị hard delete sau này, historical source có thể trả `documentId = null`.

### Ưu Tiên 2: Permission Hardening

Cần review lại các service đã có để đảm bảo không bypass rule:

- Folder/document/report/compare/admin/dashboard đều phải dùng workspace permission đúng chỗ.
- Admin APIs không expose document content, chunks, snippets, report markdown, chat messages, user questions.
- Viewer không upload, compare, generate report, delete, restore, hard delete hoặc download original file.
- Editor không manage member.
- Invited member không xem content.

### Ưu Tiên 3: Test Coverage Cho Phần Thịnh

Test hiện tại còn mỏng. Cần bổ sung integration tests hoặc manual test cases cho:

- Login Google upsert user.
- Inactive user không được cấp JWT.
- `GET /api/auth/me`.
- Create/list/get/update/delete workspace.
- Creator là owner.
- Owner invite editor/viewer.
- Duplicate member bị chặn.
- Removed member invite lại được.
- Editor/viewer không manage member.
- Last owner không bị remove/hạ role.
- Admin không tạo/truy cập workspace content.
- Invited member chưa active không xem content.

### Ưu Tiên 4: Docs/API Contract Sync

Cần đồng bộ `plan.md` với:

- `docs/frontend-docs/API_CONTRACT_MVP.md`
- `docs/backend/BE_AI_BOUNDARY_CONTRACT.md`
- `docs/backend/BACKEND_MVP_MANUAL_TEST_CHECKLIST.md`

Khi docs cũ nói khác code hiện tại, ghi rõ docs đó outdated ở phần trạng thái thay vì copy lại.

## 10. Manual Checklist Cho Thịnh

### Auth

- [ ] User login Google nhận JWT.
- [ ] JWT gọi được protected API.
- [ ] `GET /api/auth/me` trả đúng current user.
- [ ] User inactive bị từ chối.
- [ ] Logout trả `204`.
- [ ] Thiếu/invalid token trả error shape chuẩn.

### Workspace

- [ ] User tạo workspace được.
- [ ] Creator thành owner.
- [ ] User chỉ thấy workspace mà mình là active member.
- [ ] Owner update/delete workspace được.
- [ ] Editor/viewer không update/delete workspace.
- [ ] Admin không tạo/truy cập workspace content.

### Member

- [ ] Owner invite member bằng email được.
- [ ] Existing user thành active member.
- [ ] Unknown email thành invited member.
- [ ] Invited member login đúng email thì active membership.
- [ ] Owner đổi role member được.
- [ ] Owner remove member được.
- [ ] Không duplicate active member email.
- [ ] Removed member invite lại được.
- [ ] Không remove/hạ role owner cuối cùng.
- [ ] Editor/viewer không manage member.

### Permission Review

- [ ] Folder/document APIs dùng `IWorkspacePermissionService`.
- [ ] Report/compare APIs chặn viewer mutate.
- [ ] AI jobs retry cần owner/editor.
- [ ] Dashboard/admin chỉ trả metadata phù hợp.
- [ ] Admin không thấy workspace content.

### Chat/RAG Khi Implement

- [ ] Viewer tạo chat session được.
- [ ] Chat session private theo user.
- [ ] User không xem session của user khác trong cùng workspace.
- [ ] Context document/folder cross-workspace bị chặn.
- [ ] Folder context include subfolders.
- [ ] Incomplete/deleted document không dùng cho RAG.
- [ ] RAG không tạo `AiJob`.
- [ ] User/assistant messages và sources được lưu.

## 11. Verification Hiện Tại

Đã chạy:

```powershell
dotnet test backend\InsightVault.API.Tests\InsightVault.API.Tests.csproj
```

Kết quả:

```text
Passed: 5
Failed: 0
Skipped: 0
Total: 5
```

Lưu ý:

- Lần chạy đầu bị sandbox chặn network khi restore NuGet.
- Sau khi cho phép restore từ NuGet, test pass.
- Test hiện tại chủ yếu cover public endpoints và report versioning; chưa đủ cover Auth/Workspace/Member permission.

## 12. Commands Hữu Ích

Build backend:

```powershell
dotnet build backend\InsightVault.API\InsightVault.API.csproj
```

Run backend tests:

```powershell
dotnet test backend\InsightVault.API.Tests\InsightVault.API.Tests.csproj
```

Docker verification theo project docs:

```powershell
docker compose -f infra\docker-compose.yml up -d --build
docker compose -f infra\docker-compose.yml ps
dotnet test backend\InsightVault.API.Tests\InsightVault.API.Tests.csproj
```

Không dùng lệnh sau trừ khi user muốn xóa local data volumes:

```powershell
docker compose down -v
```

## 13. Definition Of Done Cho Phần Thịnh

Phần Auth/Workspace/Permission của Thịnh đạt yêu cầu khi:

- User login Google thành công.
- Backend phát JWT nội bộ.
- Frontend dùng JWT gọi protected APIs được.
- `/api/auth/me` trả đúng current user.
- User inactive không dùng được API.
- User tạo workspace được.
- Creator trở thành owner.
- User chỉ thấy workspace mà họ là active member.
- Owner update/delete workspace được.
- Non-owner không manage workspace/member được.
- Owner invite/list/update/remove member được.
- Không duplicate active member email.
- Removed member invite lại được.
- Không remove/hạ role owner cuối cùng.
- Admin không truy cập workspace content.
- `IWorkspacePermissionService` được dùng nhất quán bởi folder/document/chat/report/ai job.
- Error response bám `{ errorCode, message, details }`.
- Backend tests pass.

Nếu Thịnh nhận tiếp Chat/RAG API, DoD bổ sung:

- Chat session list/create/delete hoạt động đúng.
- Chat message send/list hoạt động đúng.
- AI `/rag/query` được gọi qua backend.
- Context `@file`/`@folder` được resolve ở backend.
- Viewer chat được.
- Admin không chat workspace content được.
- RAG chat không tạo `AiJob`.
- User/assistant messages, contexts, sources được persist.

## 14. Assumptions

- Thịnh là backend owner cho Auth/Workspace/Permission.
- Thịnh có thể nhận tiếp Chat sessions/messages API nếu team chốt theo docs timeline cũ.
- MVP không có password login.
- MVP chưa cần refresh token phức tạp.
- MVP chưa cần email invite thật; invite bằng email trong database là đủ.
- MVP chưa làm folder/document-level permission.
- MVP chưa làm owner transfer.
- MVP chưa làm web search.
- MVP chưa cho viewer download original file.
- Backend phải enforce permission trước khi gọi AI service.
- AI service không expose trực tiếp cho browser.
