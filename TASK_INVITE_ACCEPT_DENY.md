# Task Invite Accept/Decline Qua Email

Trạng thái: backend implemented, FE invitation UI implemented.

FE đã có route `/invitations` để xem danh sách lời mời pending của current user, route `/invitations/{invitationId}` để mở từ email `View invitation`, và nút Accept/Decline gọi đúng Backend API. Modal invite trong workspace đã chuyển sang `POST /api/workspaces/{workspaceId}/invitations` thay vì endpoint member cũ.

Mục tiêu: đổi workspace invite từ flow "add member ngay" sang flow "mời email đã có tài khoản, gửi email View invitation, user vào UI để Accept/Decline, chỉ khi Accept mới trở thành active member".

## 1. Nguồn Đã Rà Lại

Docs:

- `docs/frontend-docs/API_CONTRACT_MVP.md`
- `docs/about-project/PROJECT_FEATURES_MVP.md`
- `docs/about-project/CURRENT_PROJECT_CONTEXT_FOR_BUSINESS_RULE_REVIEW.md`
- `docs/about-project/PROJECT_PLAN_MVP_BUILD.md`
- `docs/about-project/TEAM_EXECUTION_ARCHITECTURE_PLAN.md`
- `docs/about-project/PROJECT_EXPLANATION.md`
- `docs/about-project/ACTIVITY_DIAGRAMS.md`
- `docs/backend/BACKEND_STRUCTURE_GUIDE.md`
- `docs/backend/DATABASE_SCHEMA.md`
- `docs/backend/BACKEND_MVP_MANUAL_TEST_CHECKLIST.md`
- `docs/backend/BE_AI_BOUNDARY_CONTRACT.md`

Code:

- `backend/InsightVault.API/Controllers/WorkspacesController.cs`
- `backend/InsightVault.API/Application/Services/Workspaces/WorkspaceService.cs`
- `backend/InsightVault.API/Application/Services/Workspaces/WorkspacePermissionService.cs`
- `backend/InsightVault.API/Application/Services/Auth/AuthService.cs`
- `backend/InsightVault.API/Infrastructure/Persistence/Repositories/UserRepository.cs`
- `backend/InsightVault.API/Infrastructure/Emails/MessagingEmailService.cs`
- `backend/InsightVault.API/Infrastructure/BackgroundJobs/EmailWorker.cs`
- `backend/InsightVault.API/Data/InsightVaultDbContext.cs`
- `backend/InsightVault.API/Domain/Entities/WorkspaceMember.cs`
- `backend/InsightVault.API/Domain/Enums/MemberStatus.cs`
- `backend/InsightVault.API/Domain/Enums/WorkspaceRole.cs`

## 2. Kết Luận Sau Khi Rà Docs

Các rule chắc chắn phải giữ:

- Backend là system-of-record cho auth, member, permission, DB state và email invite.
- FE chỉ gọi Backend API, không gửi email trực tiếp.
- Chỉ workspace `owner` được manage member/invite.
- `editor` không được invite/remove member.
- `viewer` không được invite/remove member.
- System `admin` không được truy cập workspace content.
- Permission workspace content phải dựa trên active `workspace_members`, không chỉ dựa vào `workspaces.owner_id`.
- Member/pending invite chưa active không được thấy folder, document, chunks, chat, report, compare, upload, download file gốc hoặc RAG.
- Removed member có thể invite lại sau.
- Folder không phải permission boundary riêng trong MVP.
- Controller phải mỏng; business rule nằm trong `Application/Services`.
- DTO là public API contract, không return EF entity trực tiếp.
- Repository không gọi `SaveChangesAsync`; service gọi `SaveChangesAsync`.
- DB enum hiện tại đang lưu dạng string qua `EnumToStringConverter`, nên invitation `role/status` cũng nên lưu `varchar(50)` để cùng convention.

## 3. Phương Án Tốt Nhất Cho Dự Án

Chọn phương án:

- Tạo bảng riêng `workspace_invitations`.
- Thêm API invitation riêng: `POST /api/workspaces/{workspaceId}/invitations`.
- Không dùng `POST /api/workspaces/{workspaceId}/members` cho flow invite mới, vì pending invitation chưa phải là workspace member.
- Backend gửi email bằng email pipeline hiện có.
- Email có nút `View invitation`, giống GitHub.
- `View invitation` mở FE route, ví dụ `/invitations/{invitationId}` hoặc `/invitations/respond?invitationId=...`.
- Nếu user chưa login, FE redirect sang login rồi quay lại invitation page.
- FE hiện trang danh sách/chi tiết lời mời, có nút Accept/Decline.
- Accept/Decline dùng JWT current user và gọi Backend API.
- Khi Accept mới tạo hoặc reactivate `workspace_members`.
- Khi Decline chỉ mark invitation `Declined`, không tạo member.

Lý do chọn:

- Sạch về domain: invitation là lời mời, membership là quyền truy cập thật.
- Tránh nhét token/expiry/resend/audit vào `workspace_members`.
- Ít rủi ro permission: pending invitation không được grant content access.
- Dễ audit, resend, expire, cancel sau này.
- Giống GitHub hơn: user phải login đúng account được mời mới xem/accept/decline được invitation.
- Có trang để user xem các lời mời pending trong 7 ngày trước khi hết hạn.

Không chọn:

- Không thêm token vào `workspace_members` trừ khi team muốn MVP cực nhanh.
- Không dùng state-changing `GET` link trong email.
- Không dùng token-only Accept/Decline trực tiếp từ email nếu muốn giống GitHub và chắc chắn đúng account.
- Không để FE gửi email.
- Không tự activate invite khi user login.

## 4. Lưu Ý Security Cần Team Chốt

Vì yêu cầu mới là làm giống GitHub và có trang xem lời mời, Accept/Decline nên chạy sau khi user login đúng account.

Điều này nghĩa là:

- Email chỉ nên chứa link `View invitation`.
- FE page gọi Backend bằng JWT hiện tại.
- Backend phải check `currentUser.Id == invitation.InvitedUserId`.
- Nếu không đúng user, Backend nên trả `404` hoặc `403`; kiểu GitHub thường dùng `404` để tránh lộ invitation.
- Token trong email vẫn có thể dùng để mở đúng invitation, nhưng không được tự grant membership nếu chưa có JWT đúng user.

Khuyến nghị MVP:

- Dùng `invitationId` trong FE route nếu không cần email token bí mật.
- Hoặc dùng token random trong link nếu muốn tránh lộ sequential/guessable ID; vẫn phải verify JWT current user khi Accept/Decline.
- Expire sau 7 ngày.
- Invitation state phải single-use: Pending -> Accepted/Declined/Expired/Cancelled.
- `GET /api/me/workspace-invitations/{invitationId}` chỉ trả data nếu đúng current user.
- `POST /api/me/workspace-invitations/{invitationId}/accept` mới đổi state.
- `POST /api/me/workspace-invitations/{invitationId}/decline` mới đổi state.

## 5. Database Design PostgreSQL

Thêm entity/table:

```text
workspace_invitations
```

Quan hệ:

```text
workspaces 1 -> many workspace_invitations
users      1 -> many workspace_invitations as invited_user
users      1 -> many workspace_invitations as invited_by

workspace_invitations --Accept--> create/reactivate workspace_members
```

Không cần FK trực tiếp từ `workspace_invitations` sang `workspace_members`, vì quan hệ này là nghiệp vụ: chỉ khi Accept mới tạo/reactivate member.

Schema gợi ý:

```text
id uuid primary key default gen_random_uuid()
workspace_id uuid not null
invited_user_id uuid not null
email varchar(255) not null
role varchar(50) not null
status varchar(50) not null
token_hash varchar(255) not null
expires_at timestamptz not null
invited_by_id uuid null
accepted_at timestamptz null
declined_at timestamptz null
cancelled_at timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Enum mới:

```text
WorkspaceInvitationStatus
- Pending
- Accepted
- Declined
- Expired
- Cancelled
```

FK gợi ý:

```text
workspace_id -> workspaces.id       on delete cascade
invited_user_id -> users.id         on delete restrict
invited_by_id -> users.id           on delete set null
```

Index gợi ý:

```text
unique token_hash
index workspace_id
index invited_user_id
index invited_by_id
index email
index status
index expires_at
unique (workspace_id, invited_user_id) where status = 'Pending'
```

EF Core config cần theo convention hiện tại:

- `HasDefaultValueSql("gen_random_uuid()")`
- `HasConversion(new EnumToStringConverter<WorkspaceRole>())`
- `HasConversion(new EnumToStringConverter<WorkspaceInvitationStatus>())`
- `HasMaxLength(50)` cho role/status.
- `UseSnakeCaseNamingConvention()` đang có sẵn trong Program/DbContextFactory.

## 6. API Contract Mới

### 6.1. Create Invitation

```http
POST /api/workspaces/{workspaceId}/invitations
Authorization: Bearer <jwt>
Content-Type: application/json
```

Request:

```json
{
  "email": "member@example.com",
  "role": "viewer"
}
```

Response `201 Created`:

```json
{
  "id": "invitation-id",
  "workspaceId": "workspace-id",
  "invitedUserId": "user-id",
  "email": "member@example.com",
  "role": "viewer",
  "status": "pending",
  "invitedById": "owner-user-id",
  "expiresAt": "2026-06-21T00:00:00Z",
  "createdAt": "2026-06-14T00:00:00Z",
  "updatedAt": "2026-06-14T00:00:00Z"
}
```

Errors:

- `400 invitation.invalid_request`
- `403 auth.forbidden`
- `404 workspace.not_found`
- `404 invitation.user_not_found`
- `409 invitation.duplicate_member`
- `409 invitation.pending_exists`
- `409 invitation.admin_target_not_allowed` nếu team chốt không cho invite system admin

### 6.2. Current User Invitation List

```http
GET /api/me/workspace-invitations
```

Response:

- `WorkspaceInvitationDto[]`
- Chỉ trả pending invitations của current user.
- Có thể include accepted/declined gần đây nếu FE cần history, nhưng MVP nên ưu tiên pending.

### 6.3. Current User Invitation Detail

```http
GET /api/me/workspace-invitations/{invitationId}
```

Behavior:

- Yêu cầu JWT.
- Backend verify `invited_user_id == currentUserId`.
- Nếu không đúng user, trả `404` hoặc `403`.
- Return invitation detail để FE hiện trang giống GitHub.
- Không đổi DB state.

### 6.4. Accept

```http
POST /api/me/workspace-invitations/{invitationId}/accept
```

Behavior:

- Yêu cầu JWT.
- Verify `invited_user_id == currentUserId`.
- Check invitation `Pending`.
- Check chưa expired.
- Check workspace chưa deleted.
- Check invited user vẫn active.
- Nếu target đã active member: mark accepted hoặc trả conflict tùy case duplicate.
- Nếu có member `Removed`: reactivate thành `Active`.
- Nếu chưa có member row: tạo `workspace_members` mới `Active`.
- Set `accepted_at`.
- Return `WorkspaceInvitationDto` hoặc action result DTO.

### 6.5. Decline

```http
POST /api/me/workspace-invitations/{invitationId}/decline
```

Behavior:

- Yêu cầu JWT.
- Verify `invited_user_id == currentUserId`.
- Check invitation `Pending`.
- Check chưa expired.
- Mark `Declined`.
- Set `declined_at`.
- Không tạo active member.
- Return `WorkspaceInvitationDto` hoặc action result DTO.

### 6.6. Owner APIs

Để owner quản lý lời mời trong workspace:

```http
GET /api/workspaces/{workspaceId}/invitations
POST /api/workspaces/{workspaceId}/invitations/{invitationId}/resend
POST /api/workspaces/{workspaceId}/invitations/{invitationId}/cancel
```

Các API này chỉ owner được gọi.

### 6.7. Email Link

Email không nên chứa Accept/Decline trực tiếp. Email nên có nút:

```text
View invitation
```

Link trỏ về FE:

```text
{FrontendBaseUrl}/invitations/{invitationId}
```

Hoặc nếu team muốn dùng token trong link:

```text
{FrontendBaseUrl}/invitations/respond?token=...
```

Dù dùng `invitationId` hay `token`, Accept/Decline vẫn phải gọi Backend bằng JWT và Backend phải verify đúng current user.

## 7. Backend Task A-Z

### A. Domain

- Tạo `Domain/Entities/WorkspaceInvitation.cs`.
- Tạo `Domain/Enums/WorkspaceInvitationStatus.cs`.
- Cân nhắc thêm navigation collections vào `User` và `Workspace`; nếu không cần query navigation trực tiếp thì có thể bỏ để ít động entity.

### B. DbContext

- Thêm `DbSet<WorkspaceInvitation> WorkspaceInvitations`.
- Thêm `ConfigureWorkspaceInvitations(modelBuilder)`.
- Dùng enum-to-string converter cho `WorkspaceRole` và `WorkspaceInvitationStatus`.
- Thêm FK/index/filter index như section DB.
- Generate EF migration.
- Update model snapshot.

### C. DTOs

Tạo folder:

```text
DTOs/Invitations
```

DTO cần có:

- `CreateWorkspaceInvitationRequest`
- `WorkspaceInvitationDto`
- `WorkspaceInvitationStatusDto` nếu cần public enum riêng
- `WorkspaceInvitationActionResultDto` nếu endpoint JSON cần result

DTO không expose:

- `token_hash`
- raw token
- EF navigation properties

### D. Repository

Tạo abstraction:

```text
Application/Abstractions/Repositories/IWorkspaceInvitationRepository.cs
```

Methods gợi ý:

- `GetByIdAsync`
- `GetPendingByWorkspaceAndUserAsync`
- `GetByTokenHashAsync`
- `ListByWorkspaceAsync`
- `ListPendingByUserAsync`
- `AddAsync`
- `Update`

Implementation:

```text
Infrastructure/Persistence/Repositories/WorkspaceInvitationRepository.cs
```

Repository không gọi `SaveChangesAsync`.

### E. Invitation Link/Token

Nếu link email dùng `invitationId`, không bắt buộc cần token service.

Nếu team muốn link khó đoán hơn hoặc không expose raw invitation id, tạo abstraction nhỏ:

```text
Application/Abstractions/Services/Invitations/IInvitationTokenService.cs
```

Hoặc để trong `Application/Abstractions/Services/Workspaces` nếu muốn giữ module workspace.

Methods:

- `CreateToken()`
- `HashToken(string token)`

Implementation:

- Dùng `RandomNumberGenerator.GetBytes(32)`.
- Encode bằng Base64Url.
- Hash bằng SHA-256.
- So sánh token qua hash string.

Lưu ý:

- Token chỉ dùng để resolve invitation page/link.
- Không được dùng token một mình để accept/decline nếu mục tiêu là giống GitHub.
- Accept/Decline phải verify JWT current user.

### F. Options

Thêm options:

```text
WorkspaceInvitation:
  FrontendBaseUrl: "http://localhost:5173"
  ExpiresDays: 7
```

`FrontendBaseUrl` dùng để build link email:

```text
{FrontendBaseUrl}/invitations/{invitationId}
```

Validate:

- `FrontendBaseUrl` phải absolute URL.
- `ExpiresDays > 0`.

### G. Application Service

Tạo interface:

```text
Application/Abstractions/Services/Invitations/IWorkspaceInvitationService.cs
```

Tạo service:

```text
Application/Services/Invitations/WorkspaceInvitationService.cs
```

Methods:

- `CreateAsync(workspaceId, currentUserId, request)`
- `ListForCurrentUserAsync(currentUserId)`
- `GetForCurrentUserAsync(invitationId, currentUserId)`
- `AcceptAsync(invitationId, currentUserId)`
- `DeclineAsync(invitationId, currentUserId)`
- `ListByWorkspaceAsync(workspaceId, ownerUserId)`
- `ResendAsync(workspaceId, invitationId, ownerUserId)`
- `CancelAsync(workspaceId, invitationId, ownerUserId)`

Business logic chính:

- Gọi `IWorkspacePermissionService.EnsureCanManageMembersAsync`.
- Load workspace, reject nếu deleted.
- Normalize email.
- `userRepository.GetByEmailAsync`.
- Reject nếu user không tồn tại.
- Reject nếu user inactive.
- Reject system admin target nếu team chốt.
- Reject nếu active/non-removed member đang tồn tại.
- Nếu pending invitation tồn tại, reject hoặc resend theo quyết định team.
- Tạo token raw + token hash nếu team chọn link dạng token; nếu dùng `invitationId` thì bỏ bước token.
- Save invitation `Pending`.
- Build FE `View invitation` URL.
- Gửi email.
- `SaveChangesAsync` ở service.

### H. Workspaces Service

Sửa `WorkspaceService.AddMemberAsync` để không còn tạo invite kiểu cũ.

Khuyến nghị:

- Hoặc giữ `AddMemberAsync` chỉ cho admin/internal direct add nếu còn cần.
- Hoặc deprecate endpoint `POST /members` cho invite flow.
- Không tự tạo `Invited` member cho unknown email nữa.
- Không tự active existing user khi invite nữa.

Nếu giữ endpoint cũ để compatibility:

- Có thể cho `POST /members` gọi qua `IWorkspaceInvitationService.CreateAsync`.
- Nhưng response shape sẽ khác; cần cập nhật FE/API contract.

### I. Auth Login Auto-Activate

Hiện tại `AuthService.LoginWithGoogleAsync` gọi:

```csharp
await userRepository.ActivateInvitedMembershipsAsync(user, cancellationToken);
```

Task cần làm:

- Gỡ call này khỏi login flow.
- Xóa hoặc ngưng dùng `IUserRepository.ActivateInvitedMembershipsAsync`.
- Nếu giữ method để xử lý dữ liệu legacy, không gọi tự động khi login.

Lý do:

- Flow mới yêu cầu user Accept mới active.
- Nếu login tự active thì bypass Accept/Decline.

### J. Email

Sửa `IEmailService.SendWorkspaceInviteAsync`.

Gợi ý signature mới:

```csharp
Task SendWorkspaceInviteAsync(
    string email,
    string inviterName,
    string workspaceName,
    string role,
    string viewInvitationUrl,
    DateTimeOffset expiresAt,
    CancellationToken cancellationToken = default);
```

Sửa `MessagingEmailService`:

- Subject rõ ràng.
- Body có workspace, inviter, role, expiry.
- Button/link `View invitation` mở `viewInvitationUrl`.
- Có text fallback: copy/paste link nếu button không hoạt động.
- Có note: invitation dành cho email nào.
- Không nhét raw token vào log.

Email vẫn đi qua `IMessagePublisher` và `EmailWorker` hiện có.

### K. Controller

Tạo:

```text
Controllers/WorkspaceInvitationsController.cs
```

Endpoints:

- `POST /api/workspaces/{workspaceId:guid}/invitations` có `[Authorize]`.
- `GET /api/me/workspace-invitations` có `[Authorize]`.
- `GET /api/me/workspace-invitations/{invitationId:guid}` có `[Authorize]`.
- `POST /api/me/workspace-invitations/{invitationId:guid}/accept` có `[Authorize]`.
- `POST /api/me/workspace-invitations/{invitationId:guid}/decline` có `[Authorize]`.
- `GET /api/workspaces/{workspaceId:guid}/invitations` có `[Authorize]`, owner only.
- optional `resend/cancel` endpoints nếu team chốt cần trong MVP.

Controller phải mỏng:

- Nhận request.
- Gọi service.
- Return DTO hoặc HTML result.
- Không query DbContext trong controller.

Error handling:

- Ưu tiên `ApiException` từ service.
- Tránh thêm business rule bằng `try/catch` dày trong controller.

### L. Frontend Invitation Pages

FE cần làm trang giống GitHub:

- Trang `/invitations` để xem danh sách lời mời đang pending.
- Trang `/invitations/{invitationId}` để xem chi tiết một lời mời.
- Nếu user chưa login, redirect sang `/login?returnUrl=/invitations/{invitationId}`.
- Sau login quay lại invitation page.
- Page detail hiển thị:
  - inviter name/email
  - workspace name
  - role được mời
  - email được mời
  - expiry date
  - trạng thái pending/accepted/declined/expired
  - nút Accept
  - nút Decline
- Accept gọi `POST /api/me/workspace-invitations/{invitationId}/accept`.
- Decline gọi `POST /api/me/workspace-invitations/{invitationId}/decline`.
- Sau Accept có thể redirect sang workspace detail.
- Sau Decline có thể quay về invitation list.

BE vẫn phải enforce permission; FE chỉ hiển thị UI.

Lưu ý:

- Không đổi state bằng GET.
- Không tự gửi email.
- Không tự grant membership.
- Không hiển thị workspace content.

### M. Permission Hardening

Sau khi flow mới xong:

- Pending invitation không được list workspace như active member.
- Pending invitation không được gọi folder/document/chat/report/compare/upload.
- `IWorkspacePermissionService` vẫn chỉ cho `MemberStatus.Active`.
- System admin vẫn bị chặn khỏi workspace content.

### N. Docs Update Sau Khi Team Chốt

Sau khi leader/team approve:

- Update `docs/frontend-docs/API_CONTRACT_MVP.md`.
- Update `docs/backend/DATABASE_SCHEMA.md`.
- Update `docs/backend/BACKEND_STRUCTURE_GUIDE.md` nếu thêm module/service mới.
- Update `docs/backend/BACKEND_MVP_MANUAL_TEST_CHECKLIST.md`.
- Có thể cập nhật `WORKSPACE_INVITATION_ACCEPT_DENY_PROPOSAL.md` từ proposed sang approved/implemented.

## 8. Frontend Cần Làm

Với flow giống GitHub, FE cần làm invitation UI.

Invite form của owner:

- Đổi invite API call từ:

```text
POST /api/workspaces/{workspaceId}/members
```

sang:

```text
POST /api/workspaces/{workspaceId}/invitations
```

- FE cần handle response `WorkspaceInvitationDto`.
- Sau khi invite thành công, FE có thể show "Invitation sent".
- Member list hiện tại chỉ nên show active members nếu chưa làm pending UI riêng.
- Nếu owner cần thấy pending invites trong workspace settings, FE gọi `GET /api/workspaces/{workspaceId}/invitations`.

Invitation pages cho user được mời:

- Thêm page `/invitations`.
- Thêm page `/invitations/{invitationId}`.
- Email `View invitation` trỏ tới `/invitations/{invitationId}`.
- Nếu chưa login, redirect sang login và giữ `returnUrl`.
- Sau login, FE gọi `GET /api/me/workspace-invitations/{invitationId}`.
- Nếu Backend trả `404/403`, FE hiển thị "Invitation not found or not intended for this account".
- Nếu invitation pending, FE hiện Accept/Decline.
- Accept gọi `POST /api/me/workspace-invitations/{invitationId}/accept`.
- Decline gọi `POST /api/me/workspace-invitations/{invitationId}/decline`.
- Page `/invitations` gọi `GET /api/me/workspace-invitations` để user xem các lời mời còn pending trước khi hết hạn.

FE không được:

- Gửi email trực tiếp.
- Tự tạo token.
- Tự quyết định user có quyền invite hay không.
- Tự grant membership.

## 9. Acceptance Criteria

Task hoàn thành khi:

- Owner invite existing active user được.
- Owner invite unknown email bị reject.
- Owner invite inactive user bị reject.
- Editor/viewer invite bị reject.
- Existing active member invite bị reject.
- Pending duplicate invite xử lý đúng quyết định team.
- Removed member invite lại được.
- Email được gửi có link `View invitation` trỏ tới FE invitation page.
- `GET /api/me/workspace-invitations/{invitationId}` không đổi state.
- Current user không đúng `invited_user_id` không xem/accept/decline được invitation.
- `POST /api/me/workspace-invitations/{invitationId}/accept` đổi invitation sang `Accepted`.
- Accept tạo/reactivate `workspace_members.Active`.
- `POST /api/me/workspace-invitations/{invitationId}/decline` đổi invitation sang `Declined`.
- Decline không tạo member.
- Expired invitation không accept/decline được hoặc trả expired state theo design.
- Login Google không còn tự active pending invite.
- Pending invite không access được workspace content.
- Active member sau Accept access được workspace theo role.
- Tests pass.

## 10. Test Plan

Automated tests nên thêm:

- `WorkspaceInvitationServiceTests` hoặc integration tests qua API factory.
- Owner creates invitation for existing user.
- Owner cannot invite unknown email.
- Owner cannot invite inactive user.
- Editor cannot invite.
- Viewer cannot invite.
- Admin target rejected nếu team chốt.
- Duplicate active member returns conflict.
- Duplicate pending invite returns conflict/resend.
- Accept creates active member.
- Accept reactivates removed member.
- Decline does not create member.
- Expired invitation rejected.
- Wrong current user cannot view/accept/decline invitation.
- Login does not activate invited memberships.

Manual/Postman tests:

1. Login owner, tạo workspace.
2. Login target user ít nhất một lần để user tồn tại.
3. Owner gọi invite API.
4. Check DB có `workspace_invitations.Pending`.
5. Check email hoặc log email có URL `View invitation`.
6. Mở URL bằng browser.
7. Nếu chưa login, login đúng user được mời.
8. FE invitation page load được invitation detail.
9. Bấm Accept.
10. Check DB:
   - invitation `Accepted`
   - `workspace_members.Active`
11. Target login web, workspace xuất hiện.
12. Lặp lại với Decline và verify workspace không xuất hiện.

Verification commands:

```powershell
dotnet test backend\InsightVault.API.Tests\InsightVault.API.Tests.csproj
docker compose -f infra\docker-compose.yml ps
```

Không dùng:

```powershell
docker compose down -v
```

trừ khi team chủ động muốn xóa local volumes.

## 11. Thứ Tự Implement Khuyến Nghị

Backend đã thực hiện các bước 3-14 trong nhánh hiện tại. Các bước còn lại cần phối hợp:

1. FE update invite call nếu route/response đổi.
2. FE thêm `/invitations` và `/invitations/{invitationId}`.
3. Test Postman + email local với SMTP/RabbitMQ thật.
4. Team chốt có cần resend/cancel invite ngay trong MVP không.
5. Team chốt dữ liệu `workspace_members.Invited` cũ sẽ migrate/handle như thế nào.

## 12. Quyết Định Cần Team Chốt Trước Khi Code

- Có đồng ý tạo bảng `workspace_invitations` không?
- Có đồng ý route mới `POST /api/workspaces/{workspaceId}/invitations` không?
- Có bỏ/deprecate invite qua `POST /members` không?
- Pending invite có cần hiện trong member list không?
- Duplicate pending invite là reject hay resend?
- Invite expiry là 7 ngày hay giá trị khác?
- System admin có bị reject khi được invite vào workspace không?
- Link email dùng `invitationId` hay token random?
- Có bắt buộc user login đúng account trước khi Accept/Decline không? Khuyến nghị: có, để giống GitHub.
- Có cần owner cancel/resend invite ngay trong MVP không?
- Dữ liệu `workspace_members.Invited` cũ sẽ xử lý như thế nào?
