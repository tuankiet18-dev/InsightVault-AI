# Plan Backend Cho Thịnh

## 1. Tổng Quan Dự Án

InsightVault AI là một collaborative AI-powered knowledge workspace. Sản phẩm giúp nhóm project tạo workspace chung, mời thành viên, quản lý folder/document, upload tài liệu, xử lý tài liệu bằng AI, hỏi đáp RAG, so sánh tài liệu và tạo Markdown report.

Backend là system-of-record của hệ thống. Backend chịu trách nhiệm auth, permission, validation, metadata, workspace/document ownership, job/report/chat persistence và gọi AI service nội bộ.

AI service chỉ xử lý AI internals như extract text, chunking, embedding, vector search, prompt, Gemini call, compare và report generation. AI service không được tự quyết định permission.

## 2. Phạm Vi Của Thịnh

Thịnh phụ trách phần Backend foundation:

- Google OAuth login.
- JWT nội bộ.
- User và current user API.
- Workspace CRUD.
- Workspace member invite/list/update/remove.
- Role/permission service cho `owner`, `editor`, `viewer`.

Đây là lớp nền cho các phần của Anh và Kiệt:

- Folder/document/upload phải dùng permission service để check `owner/editor/viewer`.
- Chat/RAG/compare/report phải check workspace membership trước khi gọi AI service.
- Frontend chỉ gọi Backend API; không gọi trực tiếp AI service.

## 3. Cách Tổ Chức Thư Mục Cần Bám

Backend đi theo pattern:

```text
Controller -> Application Service -> Repository -> DbContext
```

Quy tắc implement:

- `Controllers`: controller mỏng, chỉ nhận HTTP request, lấy route/body/query, gọi service và trả response.
- `DTOs/Auth`, `DTOs/Workspaces`: public API contract giữa frontend và backend, không return EF entity trực tiếp.
- `Application/Abstractions/Services/Auth`: interface cho auth/current user.
- `Application/Abstractions/Services/Workspaces`: interface cho workspace/member/permission use cases.
- `Application/Services/Auth`: business logic login và current user.
- `Application/Services/Workspaces`: business logic workspace/member/permission.
- `Infrastructure/Auth`: JWT generation, Google token verification, current user context.
- `Infrastructure/Persistence/Repositories`: EF Core queries cụ thể, không gọi `SaveChangesAsync` trong repository.
- `Infrastructure/DependencyInjection.cs`: đăng ký service/repository/auth infrastructure.

Không đưa EF query lớn, MinIO logic, AI HTTP calls hoặc permission rules trực tiếp vào controller.

## 4. Ràng Buộc API Contract

Tất cả implementation phải bám `docs/frontend-docs/API_CONTRACT_MVP.md`.

Global rules:

- BE base route là `/api`.
- FE dùng `VITE_API_BASE_URL`.
- Mọi business API phải dùng `Authorization: Bearer <jwt>`.
- Public APIs chỉ gồm `GET /api/health`, `GET /api/health/db`, `GET /api/meta`, `POST /api/auth/google`.
- IDs trả về là UUID strings.
- Dates trả về là ISO-8601 strings.
- Soft delete trả `204 No Content`.
- Error response đúng shape `{ errorCode, message, details }`.
- Public enum values phải là lowercase strings: `user`, `admin`, `owner`, `editor`, `viewer`, `invited`, `active`, `removed`.
- `WorkspaceDto.currentUserRole` phải đúng role của current user trong workspace.

## 5. Auth Implementation

Endpoints:

- `POST /api/auth/google`
- `GET /api/auth/me`
- `POST /api/auth/logout`

`POST /api/auth/google` request:

```json
{
  "idToken": "google-id-token"
}
```

Xử lý:

1. Verify Google `idToken`.
2. Lấy Google subject, email, full name, avatar URL.
3. Nếu user chưa tồn tại theo `google_id` hoặc email thì tạo user mới.
4. Nếu user đã tồn tại thì update name/avatar/email nếu cần.
5. Set `last_login_at`.
6. Tìm các `workspace_members` đang `invited` theo email và gán `user_id`, đổi status thành `active`, set `joined_at`.
7. Phát hành JWT nội bộ.
8. Trả `AuthResponse`.

Ràng buộc:

- Không lưu password riêng.
- System role gồm `user` và `admin`; admin không thay thế workspace member role.
- Nếu user inactive thì không phát JWT thành công.
- JWT claims cần có user id, email, system role và expiry.

`GET /api/auth/me`:

- Yêu cầu JWT hợp lệ.
- Load user từ database.
- User không tồn tại hoặc inactive thì trả `401/403`.
- Trả `UserDto`.

`POST /api/auth/logout`:

- MVP dùng stateless JWT nên logout chỉ trả `204 No Content`.
- Frontend tự xóa token.

## 6. Workspace Implementation

Endpoints:

- `GET /api/workspaces?q=`
- `POST /api/workspaces`
- `GET /api/workspaces/{workspaceId}`
- `PATCH /api/workspaces/{workspaceId}`
- `DELETE /api/workspaces/{workspaceId}`

Rules:

- User tạo workspace tự động là `owner`.
- Creator được ghi vào cả `workspaces.owner_id` và `workspace_members`.
- Mọi access workspace phải verify active membership.
- `owner` mới được update/delete workspace.
- Delete workspace là soft delete bằng `deleted_at`.
- Không thêm `ai_system_prompt` nếu chưa thống nhất schema/migration với team.

`POST /api/workspaces` request:

```json
{
  "name": "InsightVault AI Project",
  "description": "Project workspace"
}
```

## 7. Workspace Member Implementation

Endpoints:

- `GET /api/workspaces/{workspaceId}/members`
- `POST /api/workspaces/{workspaceId}/members`
- `PATCH /api/workspaces/{workspaceId}/members/{memberId}`
- `DELETE /api/workspaces/{workspaceId}/members/{memberId}`

Rules:

- Chỉ `owner` được manage members.
- Không cho tạo duplicate member cùng email trong một workspace.
- Role hợp lệ: `owner`, `editor`, `viewer`.
- Status hợp lệ: `invited`, `active`, `removed`.
- Không hạ role/remove owner cuối cùng.
- Remove member là soft remove bằng status `removed` và set `removed_at`.

Invite member request:

```json
{
  "email": "member@example.com",
  "role": "editor"
}
```

Invite xử lý:

1. Check current user là owner.
2. Normalize email về lowercase/trim.
3. Nếu user đã tồn tại theo email, gán `user_id` và status `active`.
4. Nếu user chưa tồn tại, tạo membership status `invited`.
5. Set `invited_by_id`, `invited_at`.
6. Trả `WorkspaceMemberDto`.

## 8. Permission Service

Centralize permission bằng `IWorkspacePermissionService`.

Interface:

```csharp
public interface IWorkspacePermissionService
{
    Task<WorkspaceRole?> GetUserRoleAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default);
    Task<bool> IsActiveMemberAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default);
    Task EnsureCanReadWorkspaceAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default);
    Task EnsureCanManageWorkspaceAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default);
    Task EnsureCanManageMembersAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default);
    Task EnsureCanMutateWorkspaceContentAsync(Guid workspaceId, Guid userId, CancellationToken cancellationToken = default);
}
```

Rules:

- Read workspace: `owner`, `editor`, `viewer` active.
- Manage workspace: `owner`.
- Manage members: `owner`.
- Mutate content: `owner`, `editor`.
- Viewer: read-only, có thể chat nếu team giữ viewer chat trong MVP.

Tất cả folder/document/chat/report/job API sau này phải dùng service này.

## 9. Error Handling

Error response:

```json
{
  "errorCode": "workspace.not_found",
  "message": "Workspace not found",
  "details": {}
}
```

Status code:

- `400`: request invalid.
- `401`: chưa login hoặc JWT invalid.
- `403`: login rồi nhưng không đủ quyền.
- `404`: entity không tồn tại hoặc user không được biết entity đó tồn tại.
- `409`: duplicate email/member hoặc conflict business rule.

## 10. Config

Local development có thể dùng `appsettings.Development.json` hoặc environment variables:

```json
{
  "Jwt": {
    "Issuer": "InsightVault.API",
    "Audience": "InsightVault.Frontend",
    "SigningKey": "development-only-long-secret-key",
    "ExpiresMinutes": 120
  },
  "GoogleAuth": {
    "ClientId": "google-client-id.apps.googleusercontent.com"
  }
}
```

Không commit secret production. Production dùng environment variables.

Google OAuth flow:

- Frontend lấy `idToken`.
- Backend verify token bằng `GoogleAuth:ClientId`.
- Backend phát hành JWT nội bộ.

## 11. Test Plan

Build:

```powershell
dotnet build .\backend\InsightVault.API\InsightVault.API.csproj
```

Database:

```powershell
docker compose -f .\infra\docker-compose.dev.yml up -d postgres
dotnet ef database update --project .\backend\InsightVault.API\InsightVault.API.csproj --startup-project .\backend\InsightVault.API\InsightVault.API.csproj
```

Manual API flow:

1. Login Google và nhận JWT.
2. Gọi `GET /api/auth/me`.
3. Tạo workspace.
4. List workspace.
5. Xem workspace detail.
6. Update workspace.
7. Invite member.
8. List members.
9. Update member role.
10. Remove member.
11. Test user ngoài workspace bị chặn.
12. Test viewer không được manage member.
13. Test viewer không được mutate folder/document/upload sau khi API của Anh có.
14. Test system role admin vào được admin-only API sau khi admin API có.
15. Test CORS/browser request từ frontend localhost.

Full check trước khi push:

```powershell
.\scripts\check.ps1
```

## 12. Definition Of Done Cho Phần Thịnh

Phần của Thịnh được xem là xong khi:

- User login Google thành công.
- Backend phát hành JWT nội bộ.
- Frontend có thể dùng JWT gọi protected APIs.
- `/api/auth/me` trả đúng current user.
- User tạo workspace được.
- Creator là owner của workspace.
- Owner mới được manage workspace/member.
- Owner invite/list/update/remove member được.
- User chỉ thấy workspace mình là active member.
- User ngoài workspace không truy cập được workspace data.
- Permission service có thể dùng lại cho folder/document/chat/report APIs.
- API contract đúng route `/api`, Bearer auth, lowercase enum strings, UUID/ISO dates và `204` cho soft delete.
- CORS local/deploy được cấu hình để FE login/call API không lỗi.
- Backend build clean.

## 13. Ngoài Phạm Vi Thịnh

- MinIO storage implementation.
- Document upload pipeline.
- AI job worker.
- Python AI service internals.
- Chunking, embedding, pgvector search logic.
- Prompt/Gemini implementation.
- Report/compare AI generation internals.
- Frontend UI.

## 14. Assumptions

- Thịnh là BE1/backend lead theo docs.
- MVP không cần password login.
- MVP không cần refresh token phức tạp.
- MVP không cần email invite thật; invite bằng email trong DB là đủ.
- MVP không cần realtime collaboration.
- MVP không cần ownership transfer.
- `workspace_members` là nguồn phân quyền chính, không chỉ dựa vào `workspaces.owner_id`.
