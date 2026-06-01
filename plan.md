# Plan Backend Cho Thịnh

Tài liệu này là kế hoạch riêng cho phần backend của Thịnh, được tổng hợp lại từ toàn bộ thư mục `docs/`. Mục tiêu là bám đúng scope dự án, đúng API contract với frontend, đúng ranh giới backend/AI service, và đúng phân công team.

## 1. Nguồn Đã Đọc

Các file đã được dùng để tổng hợp plan:

- `docs/about-project/PROJECT_EXPLANATION.md`
- `docs/about-project/PROJECT_FEATURES_MVP.md`
- `docs/about-project/PROJECT_PLAN_MVP_BUILD.md`
- `docs/about-project/TEAM_EXECUTION_ARCHITECTURE_PLAN.md`
- `docs/about-project/INSIGHTVAULT_AI_8_WEEK_PROJECT_PLAN.md`
- `docs/backend/BACKEND_STRUCTURE_GUIDE.md`
- `docs/backend/AI_SERVICE_BOUNDARY_REVIEW.md`
- `docs/frontend-docs/API_CONTRACT_MVP.md`
- `docs/frontend-docs/UI_UX_SCREEN_SPEC_KNOWLEDGE_IDE.md`
- `docs/AI-service/PROJECT_STATUS_AND_RISK_REPORT.md`
- `docs/AI-service/AI_SERVICE_COMPLETION_REPORT.md`

Nguồn chuẩn nhất cho phần backend/API là:

- `docs/backend/BACKEND_STRUCTURE_GUIDE.md`
- `docs/frontend-docs/API_CONTRACT_MVP.md`
- `docs/about-project/INSIGHTVAULT_AI_8_WEEK_PROJECT_PLAN.md`
- `docs/about-project/TEAM_EXECUTION_ARCHITECTURE_PLAN.md`

## 2. Tổng Quan Dự Án

InsightVault AI là một collaborative AI-powered knowledge workspace cho nhóm project.

Luồng giá trị chính của MVP:

```text
Login -> Shared workspace -> Invite member -> Upload documents
-> Process/chunk/embed -> Summary -> RAG chat
-> Compare/gap detection -> Generate Markdown report -> Admin monitoring
```

InsightVault AI không chỉ là nơi lưu file. Dự án có 3 lớp giá trị:

- Shared document workspace: workspace, folder, document, member roles.
- AI document understanding: summary, RAG chat, semantic retrieval.
- Insight generation: compare, gap/conflict detection, Markdown report.

Tech stack chính:

- Frontend: React Vite + Tailwind.
- Backend: ASP.NET Core Web API.
- Auth: Google OAuth + JWT nội bộ.
- Database: PostgreSQL + pgvector.
- Storage: MinIO.
- AI service: Python service.
- AI provider: Gemini API.
- Background jobs: `.NET BackgroundService + ai_jobs`; RabbitMQ chỉ là optional.

## 3. Kiến Trúc Backend Cần Bám

Backend là system-of-record của hệ thống.

Backend chịu trách nhiệm:

- API validation.
- Authentication.
- Authorization/permission.
- Workspace/member/folder/document metadata.
- MinIO upload orchestration.
- AI job lifecycle.
- Chat/report persistence.
- Gọi Python AI service nội bộ.

AI service chịu trách nhiệm:

- Extract text.
- Clean text.
- Chunking.
- Embedding.
- Vector search.
- Prompt logic.
- Gemini calls.
- RAG answer.
- Compare/report generation internals.

Frontend chỉ gọi Backend API. Frontend không gọi trực tiếp AI service.

Dependency direction:

```text
Controllers
  -> Application service interfaces
  -> Application services
  -> Repository interfaces
  -> Repository implementations
  -> DbContext
```

Quy tắc tổ chức code:

- `Controllers`: controller mỏng, chỉ nhận HTTP input, gọi service, trả response.
- `DTOs`: API contract public giữa frontend và backend; không trả EF entity trực tiếp.
- `Application/Abstractions/Services`: interface service theo feature.
- `Application/Services`: business/use-case logic.
- `Application/Abstractions/Repositories`: repository interfaces.
- `Infrastructure/Persistence/Repositories`: EF Core repository implementations.
- `Infrastructure/Auth`: JWT, Google OAuth verification, current-user helper.
- `Data`: EF Core DbContext, design-time factory, migrations.
- `Common/Errors` hoặc `DTOs/Common`: error helpers/DTO dùng chung.

Repository không gọi `SaveChangesAsync`; service là nơi commit một use case.

## 4. Role Và Permission Theo Docs

System role:

- `user`: người dùng chính của hệ thống.
- `admin`: giám sát user, AI jobs, failed jobs, error logs.

Workspace role:

- `owner`: quản lý workspace, member, folder, document, AI features, report.
- `editor`: tạo folder, upload document, hỏi AI, compare, tạo report.
- `viewer`: xem workspace/folder/document/summary/report; có thể hỏi AI nếu team giữ viewer chat trong MVP.

Member status:

- `invited`
- `active`
- `removed`

Quy tắc bắt buộc:

- Mọi business API cần JWT hợp lệ.
- Mọi truy vấn workspace/folder/document/chunk/report phải kiểm tra membership.
- Permission workspace dựa trên `workspace_members`, không chỉ dựa vào `workspaces.owner_id`.
- Active member mới được đọc workspace.
- Owner quản lý workspace/member.
- Owner/editor được mutate folder/document/upload/compare/report.
- Viewer read-only, trừ trường hợp team cho viewer chat.

## 5. Phạm Vi Chính Của Thịnh

Theo docs, Thịnh là backend owner cho:

- Auth.
- User/current user.
- JWT.
- Google OAuth.
- User/admin role foundation.
- Workspace CRUD.
- Workspace member invite/list/update/remove.
- Workspace role/permission service.

Các folder chính Thịnh sở hữu:

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

Các file shared phải sửa cẩn thận:

```text
backend/InsightVault.API/Program.cs
backend/InsightVault.API/Infrastructure/DependencyInjection.cs
backend/InsightVault.API/Data/InsightVaultDbContext.cs
backend/InsightVault.API/Data/Migrations/
```

## 6. API Contract Bắt Buộc

Nguồn chuẩn: `docs/frontend-docs/API_CONTRACT_MVP.md`.

Global rules:

- Backend base route: `/api`.
- Frontend base URL: `VITE_API_BASE_URL`, default theo docs là `http://localhost:5000/api`.
- Auth header: `Authorization: Bearer <jwt>` cho mọi business API.
- Public APIs:
  - `GET /api/health`
  - `GET /api/health/db`
  - `GET /api/meta`
  - `POST /api/auth/google`
- IDs là UUID strings.
- Dates là ISO-8601 strings.
- Soft delete trả `204 No Content`.
- Error response shape:

```json
{
  "errorCode": "workspace.not_found",
  "message": "Workspace not found",
  "details": {}
}
```

Enum public trả về lowercase:

- `user`, `admin`
- `owner`, `editor`, `viewer`
- `invited`, `active`, `removed`

## 7. Auth APIs Của Thịnh

### `POST /api/auth/google`

Auth: No.

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

Backend xử lý:

1. Verify Google `idToken` bằng `GoogleAuth:ClientId`.
2. Lấy Google subject, email, full name, avatar URL.
3. Upsert user theo Google subject hoặc email.
4. Không lưu password.
5. Nếu user inactive thì không cấp JWT.
6. Update `last_login_at`.
7. Activate invited memberships theo email nếu có.
8. Phát hành JWT nội bộ.
9. Trả `AuthResponse`.

### `GET /api/auth/me`

Auth: Yes.

Request body: không có.

Response: `UserDto`.

Backend xử lý:

- Đọc current user từ JWT.
- Load user từ database.
- User không tồn tại hoặc inactive thì trả `401/403`.

### `POST /api/auth/logout`

Auth: Yes.

Request body: không có.

Response: `204 No Content`.

MVP dùng stateless JWT nên backend không xóa session trong database. Frontend xóa token ở client sau khi nhận `204`.

## 8. Workspace APIs Của Thịnh

### `GET /api/workspaces?q=`

Auth: Yes.

Request body: không có.

Response: `WorkspaceDto[]`.

Rules:

- Chỉ list workspace mà current user là active member.
- Hỗ trợ search cơ bản theo `q`.
- `currentUserRole` phải đúng role của current user trong workspace.

### `POST /api/workspaces`

Auth: Yes.

Request:

```json
{
  "name": "InsightVault AI Project",
  "description": "Project workspace"
}
```

Response: `WorkspaceDto`.

Rules:

- `name` bắt buộc.
- Creator tự động là `owner`.
- Ghi creator vào `workspaces.owner_id`.
- Tạo record `workspace_members` status `active`, role `owner`.

### `GET /api/workspaces/{workspaceId}`

Auth: Yes.

Request body: không có.

Response: `WorkspaceDto`.

Rules:

- Active member mới đọc được.
- Workspace đã soft delete phải xem như không tồn tại.

### `PATCH /api/workspaces/{workspaceId}`

Auth: Yes.

Request:

```json
{
  "name": "New name",
  "description": "New description",
  "isArchived": false
}
```

Response: `WorkspaceDto`.

Rules:

- Chỉ owner được update workspace.
- Không cho `name` rỗng nếu client gửi `name`.

### `DELETE /api/workspaces/{workspaceId}`

Auth: Yes.

Request body: không có.

Response: `204 No Content`.

Rules:

- Chỉ owner được delete workspace.
- Delete là soft delete bằng `deleted_at`.

## 9. Workspace Member APIs Của Thịnh

### `GET /api/workspaces/{workspaceId}/members`

Auth: Yes.

Request body: không có.

Response: `WorkspaceMemberDto[]`.

Rule theo plan hiện tại: chỉ owner được quản lý và xem danh sách member.

### `POST /api/workspaces/{workspaceId}/members`

Auth: Yes.

Request:

```json
{
  "email": "member@example.com",
  "role": "editor"
}
```

Response: `WorkspaceMemberDto`.

Rules:

- Chỉ owner được invite member.
- `email` bắt buộc.
- `role` bắt buộc, chỉ nhận `owner`, `editor`, `viewer`.
- Normalize email bằng trim + lowercase.
- Không tạo duplicate member cùng email trong workspace.
- Nếu user đã tồn tại theo email: gán `userId`, status `active`, set `joinedAt`.
- Nếu user chưa tồn tại: status `invited`, userId `null`.
- Set `invitedById`, `invitedAt`.

### `PATCH /api/workspaces/{workspaceId}/members/{memberId}`

Auth: Yes.

Request:

```json
{
  "role": "viewer",
  "status": "active"
}
```

Response: `WorkspaceMemberDto`.

Rules:

- Chỉ owner được update member.
- Không hạ role owner cuối cùng.
- Không remove owner cuối cùng.
- Không activate invited member chưa có user account; user cần login Google trước để backend gắn `userId`.

### `DELETE /api/workspaces/{workspaceId}/members/{memberId}`

Auth: Yes.

Request body: không có.

Response: `204 No Content`.

Rules:

- Chỉ owner được remove member.
- Remove là soft remove: status `removed`, set `removedAt`.
- Không remove owner cuối cùng.

## 10. Permission Service Cần Dùng Chung

Permission phải centralize bằng `IWorkspacePermissionService`.

Service cần hỗ trợ:

```csharp
Task<WorkspaceRole?> GetUserRoleAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default);
Task<bool> IsActiveMemberAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default);
Task EnsureCanReadWorkspaceAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default);
Task EnsureCanManageWorkspaceAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default);
Task EnsureCanManageMembersAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default);
Task EnsureCanMutateWorkspaceContentAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default);
```

Ý nghĩa:

- `EnsureCanReadWorkspaceAsync`: owner/editor/viewer active.
- `EnsureCanManageWorkspaceAsync`: owner.
- `EnsureCanManageMembersAsync`: owner.
- `EnsureCanMutateWorkspaceContentAsync`: owner/editor.

Các module của Anh/Kiệt cần dùng service này:

- Folder CRUD.
- Document upload/list/detail/delete/retry.
- AI jobs list/detail/retry.
- Chat sessions/messages.
- Compare.
- Reports.
- Dashboard/admin nếu truy cập dữ liệu workspace.

## 11. Task Của Thịnh Theo Timeline 8 Tuần

### Tuần 3 - Foundation

- Khởi tạo ASP.NET Core Web API project.
- Thiết kế database schema cho `users`, `workspaces`, `workspace_members`.
- Dựng JWT auth structure.
- Dựng Google OAuth callback/login flow ở mức skeleton.
- Viết API contract ban đầu cho auth/workspace/member.

### Tuần 4 - Auth + Workspace

- Hoàn thiện Google OAuth login.
- Hoàn thiện JWT nội bộ.
- Hoàn thiện workspace CRUD.
- Hoàn thiện invite/list/update/remove workspace member.
- Implement permission guard cho `owner`, `editor`, `viewer`.

### Tuần 5 - Permission Review Cho Folder/Document

- Review permission cho folder/document APIs.
- Đảm bảo user chỉ truy cập được document trong workspace mà họ là member.
- Hỗ trợ Anh chuẩn hóa API response/error format.

### Tuần 6 - Chat Permission Và Persistence

Docs 8 tuần giao cho Thịnh:

- Thiết kế và implement `chat_sessions`, `chat_messages` API.
- Áp permission vào chat scope.
- Lưu lịch sử hỏi đáp.
- Lưu sources trả về từ AI service.

Lưu ý phối hợp: backend structure guide chưa tách rõ owner cho `ChatController`, nên phần chat cần thống nhất với Anh/Kiệt trước khi code để tránh conflict.

### Tuần 7 - Compare/Report Permission Review

- Bổ sung API permission cho compare/report theo workspace role.
- Review toàn bộ API auth/authorization.
- Chuẩn hóa seed/demo user và workspace nếu cần.

### Tuần 8 - Hardening

- Hardening auth, role/permission, API validation.
- Viết integration tests hoặc manual test checklist cho auth/workspace/member.
- Chuẩn bị config môi trường production cho backend.

### Tuần 9 - Deploy

- Deploy backend API.
- Cấu hình Google OAuth redirect URI cho môi trường deployed.
- Kiểm tra CORS, JWT, environment variables và logs.

### Tuần 10 - Final Polish

- Chuẩn bị phần trình bày backend architecture: auth, workspace, member, permission.
- Review API logs.
- Fix bug blocker, không mở rộng scope.

## 12. Trạng Thái Hiện Tại Trong Repo

Đã có nền backend:

- `Domain/Entities`
- `Domain/Enums`
- `DTOs`
- EF Core DbContext và migration đầu tiên.
- Repository nền.
- `AuthController.cs`
- `WorkspacesController.cs`
- Auth service.
- Workspace service.
- Workspace permission service.
- JWT issuer.
- Google token verifier.
- Current user helper.

Các endpoint thuộc Sprint 1 của Thịnh hiện đã được implement:

- `POST /api/auth/google`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/workspaces?q=`
- `POST /api/workspaces`
- `GET /api/workspaces/{workspaceId}`
- `PATCH /api/workspaces/{workspaceId}`
- `DELETE /api/workspaces/{workspaceId}`
- `GET /api/workspaces/{workspaceId}/members`
- `POST /api/workspaces/{workspaceId}/members`
- `PATCH /api/workspaces/{workspaceId}/members/{memberId}`
- `DELETE /api/workspaces/{workspaceId}/members/{memberId}`

Đã kiểm tra gần nhất:

- Backend build thành công.
- API chạy được bằng profile `http`.
- `/api/health` trả `200`.
- `/openapi/v1.json` trả `200`.
- Protected route không có JWT trả `401` JSON đúng format.
- `POST /api/auth/google` thiếu `idToken` trả `400` validation đúng format.

## 13. Việc Còn Lại Của Thịnh

Ưu tiên gần:

1. Test manual đầy đủ auth/workspace/member bằng Postman với JWT thật.
2. Tạo checklist test có dữ liệu cụ thể cho owner/editor/viewer.
3. Review lại OpenAPI/Postman collection để FE nhìn được request/response/required fields.
4. Viết hoặc bổ sung integration tests nếu team có test project.
5. Khi Anh làm folder/document/upload, review và bắt buộc dùng `IWorkspacePermissionService`.
6. Khi chat/compare/report được làm, review permission theo docs.

Ưu tiên theo timeline sau:

1. Chat sessions/messages API nếu team xác nhận Thịnh nhận phần này theo docs 8 tuần.
2. Permission cho compare/report.
3. Hardening CORS/JWT/env variables.
4. Deploy backend config.
5. Chuẩn bị demo explanation cho auth/workspace/member/permission.

## 14. Không Thuộc Phạm Vi Chính Của Thịnh

Không phải phần chính của Thịnh:

- MinIO storage implementation.
- Presigned upload implementation.
- Document upload pipeline.
- Background worker xử lý `ai_jobs`.
- Python AI service internals.
- Chunking, embedding, pgvector search.
- Prompt/Gemini implementation.
- Compare/report AI generation internals.
- Frontend UI.

Thịnh vẫn cần hỗ trợ bằng permission contract để các phần trên không bypass workspace authorization.

## 15. Config Backend Cần Có

Local development có thể dùng `appsettings.Development.json` hoặc environment variables.

Các config quan trọng:

```json
{
  "Jwt": {
    "Issuer": "InsightVault.API",
    "Audience": "InsightVault.Frontend",
    "SigningKey": "development-only-long-secret-key",
    "ExpiresMinutes": 120
  },
  "GoogleAuth": {
    "ClientId": ""
  }
}
```

Khuyến nghị:

- `GoogleAuth:ClientId` local có thể đặt bằng environment variable `GoogleAuth__ClientId`.
- Không commit secret production.
- Google Client ID không phải password, nhưng vẫn nên thống nhất qua env/config team.
- JWT signing key production phải dùng environment variable/secret manager.

Google OAuth flow đúng:

```text
Frontend lấy Google idToken
-> Frontend gọi POST /api/auth/google
-> Backend verify idToken bằng GoogleAuth:ClientId
-> Backend phát JWT nội bộ
-> Frontend dùng JWT gọi protected APIs
```

## 16. Test Plan Cho Phần Thịnh

Build:

```powershell
dotnet build .\backend\InsightVault.API\InsightVault.API.csproj
```

Database:

```powershell
docker compose -f .\infra\docker-compose.dev.yml up -d postgres
dotnet ef database update --project .\backend\InsightVault.API\InsightVault.API.csproj --startup-project .\backend\InsightVault.API\InsightVault.API.csproj
```

Run backend:

```powershell
dotnet run --project .\backend\InsightVault.API\InsightVault.API.csproj --launch-profile http
```

Manual API flow:

1. Login Google và nhận JWT.
2. Gọi `GET /api/auth/me`.
3. Tạo workspace.
4. List workspace.
5. Xem workspace detail.
6. Update workspace.
7. Invite member bằng email.
8. List members.
9. Update member role.
10. Remove member.
11. Test user ngoài workspace bị chặn.
12. Test editor không được manage members.
13. Test viewer không được manage members.
14. Test viewer không được mutate content khi folder/document APIs có.
15. Test owner cuối cùng không bị remove/hạ role.
16. Test invited member login Google bằng đúng email thì membership chuyển sang active.

Full check trước khi push:

```powershell
.\scripts\check.ps1
```

Lưu ý: `check.ps1` chạy cả frontend và AI service, nên cần `frontend/node_modules` và `ai-service/venv` đã sẵn sàng.

## 17. Definition Of Done Cho Phần Thịnh

Phần của Thịnh đạt yêu cầu khi:

- User login Google thành công.
- Backend phát JWT nội bộ.
- Frontend có thể dùng JWT gọi protected APIs.
- `/api/auth/me` trả đúng current user.
- User inactive không dùng được API.
- User tạo workspace được.
- Creator trở thành owner.
- User chỉ thấy workspace mà họ là active member.
- Active member mới đọc được workspace.
- Owner update/delete workspace được.
- Non-owner không manage workspace/member được.
- Owner invite/list/update/remove member được.
- Không duplicate member email trong cùng workspace.
- Không remove/hạ role owner cuối cùng.
- Permission service dùng lại được cho folder/document/chat/report.
- API response bám contract: route `/api`, UUID, ISO date, lowercase enum, `204` cho soft delete.
- Error response bám shape `{ errorCode, message, details }`.
- Backend build clean.
- FE gọi được API qua CORS local/deploy.

## 18. Assumptions

- Thịnh là BE1/backend lead theo docs.
- MVP không có password login.
- MVP chưa cần refresh token phức tạp.
- MVP chưa cần email invite thật; invite bằng email trong database là đủ.
- MVP chưa cần realtime collaboration.
- MVP chưa cần ownership transfer phức tạp.
- `workspace_members` là nguồn phân quyền chính.
- AI service không được expose trực tiếp cho browser.
- Backend phải enforce permission trước khi gọi AI service.
