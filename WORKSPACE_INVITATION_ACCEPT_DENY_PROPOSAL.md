# Đề Xuất Đổi Workspace Invite Sang Accept/Decline Qua Email

Trạng thái: backend implemented, FE invitation UI implemented.

FE hiện có route `/invitations` để user xem các lời mời pending, route `/invitations/{invitationId}` để mở link từ email `View invitation`, và UI Accept/Decline gọi các endpoint current-user invitation của Backend.

Tài liệu này mô tả đề xuất đổi flow invite workspace hiện tại sang kiểu giống GitHub: gửi email cho user được mời, trong email có nút View invitation, user vào UI để Accept/Decline. Tài liệu này dùng để gửi leader/team review trước khi đổi database schema, API contract, backend behavior hoặc frontend assumptions.

## Nguồn Đã Kiểm Tra

- `docs/frontend-docs/API_CONTRACT_MVP.md`
- `docs/about-project/PROJECT_FEATURES_MVP.md`
- `docs/about-project/CURRENT_PROJECT_CONTEXT_FOR_BUSINESS_RULE_REVIEW.md`
- `docs/backend/BACKEND_STRUCTURE_GUIDE.md`
- `backend/InsightVault.API/Application/Services/Workspaces/WorkspaceService.cs`
- `backend/InsightVault.API/Application/Services/Auth/AuthService.cs`
- `backend/InsightVault.API/Infrastructure/Emails/MessagingEmailService.cs`
- `backend/InsightVault.API/Domain/Entities/WorkspaceMember.cs`

## Flow Cũ Trước Khi Implement

Backend trước khi đổi xử lý invite như sau:

- Owner gọi `POST /api/workspaces/{workspaceId}/members` với body `{ email, role }`.
- Backend normalize email.
- Nếu trong workspace đã có member cùng email và status không phải `Removed`, backend reject duplicate.
- Nếu email đã thuộc về một user trong hệ thống, backend tạo hoặc kích hoạt lại `workspace_members` với `Status = Active`.
- Nếu email chưa thuộc về user nào trong hệ thống, backend tạo `workspace_members` với `Status = Invited`.
- Backend gửi email invite thông qua `IEmailService.SendWorkspaceInviteAsync`.
- Khi login Google, `AuthService` từng gọi `ActivateInvitedMembershipsAsync`, nghĩa là các membership `Invited` theo email có thể được tự động chuyển thành active khi user login.

Business rules hiện tại trong docs:

- Chỉ workspace `owner` được quản lý member.
- `editor` không được invite/remove member.
- `viewer` không được invite/remove member.
- `admin` hệ thống không được truy cập workspace content.
- Member `Invited` chỉ được thấy invitation/workspace shell, không được thấy folder, document, chunks, chat hoặc report cho tới khi active.
- Permission truy cập workspace content phải dựa trên active `workspace_members`.

## Flow Mong Muốn

Flow mới mong muốn:

- Owner chỉ được invite email đã có tài khoản InsightVault trong hệ thống.
- Backend gửi email cho user được mời.
- Email có nút `View invitation`, giống GitHub.
- User bấm `View invitation` để mở FE invitation page.
- Nếu chưa login, FE redirect sang login rồi quay lại invitation page.
- FE hiển thị Accept/Decline sau khi Backend xác nhận current user đúng là người được mời.
- User được mời chưa trở thành active workspace member cho tới khi bấm Accept.
- Nếu user Accept, backend cấp membership vào workspace.
- Nếu user Decline, backend không cấp membership.
- Sau khi Accept, user tự mở web/login để xem workspace.
- FE invitation UI là một phần của GitHub-like flow.

## Thiết Kế Khuyến Nghị

Khuyến nghị tạo bảng mới `workspace_invitations`.

Lý do:

- `workspace_members` nên đại diện cho membership thật.
- `workspace_invitations` nên đại diện cho workflow lời mời đang chờ phản hồi.
- Accept/Decline cần expiry, status, audit fields và resend handling.
- Tách bảng giúp tránh nhét token invitation vào bảng member.
- Dễ mở rộng hơn nếu sau này có expire, resend, decline, cancel invite.

Phương án khác:

- Thêm các cột token invitation vào `workspace_members`.
- Cách này nhanh hơn cho MVP nhưng làm `workspace_members` vừa là bảng member vừa là bảng invitation workflow.
- Về lâu dài sẽ khó xử lý resend/expiry/audit sạch.

Khuyến nghị cuối: tạo `workspace_invitations`.

## Thay Đổi Database

Thêm bảng `workspace_invitations`.

Các cột gợi ý:

```text
id uuid primary key
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
created_at timestamptz not null
updated_at timestamptz not null
```

Enum gợi ý:

```text
WorkspaceInvitationStatus
- Pending
- Accepted
- Declined
- Expired
- Cancelled
```

Index gợi ý:

```text
unique index on token_hash
index on workspace_id
index on invited_user_id
index on email
unique pending invite index on (workspace_id, invited_user_id) where status = 'Pending'
```

Foreign key:

```text
workspace_id -> workspaces.id
invited_user_id -> users.id
invited_by_id -> users.id on delete set null
```

Cách tạo membership:

- Khi owner gửi invite, không tạo active `workspace_members`.
- Khi Accept, tạo mới `workspace_members` hoặc kích hoạt lại row `Removed` cũ.
- Khi Decline, không tạo active member.

Xử lý member row đã tồn tại:

- Nếu target user đã là `Active`, reject vì đã là member.
- Nếu target user đã có pending invitation, team cần chốt là reject hay resend invitation.
- Nếu target user từng bị `Removed`, sau khi Accept có thể reactivate row đó.
- Nếu DB hiện có các row `Invited` từ flow cũ, cần chốt migration/backfill strategy. `^[ambiguous]`

## Đề Xuất API Contract Backend

### Invite Existing User

Phương án sạch nhất về contract là thêm route riêng cho invitations, vì lời mời chưa phải là member active:

```http
POST /api/workspaces/{workspaceId}/invitations
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "email": "member@example.com",
  "role": "viewer"
}
```

Phương án tương thích hơn với FE hiện tại là giữ route cũ:

```http
POST /api/workspaces/{workspaceId}/members
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "email": "member@example.com",
  "role": "viewer"
}
```

Response khuyến nghị:

```json
{
  "id": "invitation-id",
  "workspaceId": "workspace-id",
  "email": "member@example.com",
  "role": "viewer",
  "status": "pending",
  "invitedById": "owner-user-id",
  "expiresAt": "2026-06-21T00:00:00Z",
  "createdAt": "2026-06-14T00:00:00Z"
}
```

Lưu ý quan trọng: response này đổi từ `WorkspaceMemberDto` sang invitation DTO. Nếu FE hiện đang expect `WorkspaceMemberDto`, đây là breaking contract change.

Phương án ít ảnh hưởng hơn:

- Vẫn return `WorkspaceMemberDto` nếu backend tạo `workspace_members` với `Status = Invited`.
- Đồng thời vẫn tạo `workspace_invitations` để tracking token.
- Cách này kém sạch hơn nhưng dễ cho FE hơn. `^[inferred]`

### Current-User Invitation APIs

FE dùng các API này để làm trang giống GitHub:

```http
GET /api/me/workspace-invitations
GET /api/me/workspace-invitations/{invitationId}
POST /api/me/workspace-invitations/{invitationId}/accept
POST /api/me/workspace-invitations/{invitationId}/decline
```

Behavior:

- Các endpoint này yêu cầu JWT.
- Backend phải verify `invited_user_id == currentUserId`.
- Nếu không đúng user, trả `404` hoặc `403`.
- `GET` chỉ trả data, không đổi state.
- Validate invitation đang `Pending`.
- Validate chưa hết hạn.
- Validate invited user vẫn active.
- Validate workspace chưa bị delete.
- Accept tạo hoặc reactivate `workspace_members` thành `Active`, rồi mark invitation là `Accepted`.
- Decline mark invitation là `Declined`, không tạo active workspace member.

### Owner Invitation APIs

Owner có thể cần quản lý pending invites trong workspace:

```http
GET /api/workspaces/{workspaceId}/invitations
POST /api/workspaces/{workspaceId}/invitations/{invitationId}/resend
POST /api/workspaces/{workspaceId}/invitations/{invitationId}/cancel
```

Các endpoint này yêu cầu JWT và chỉ owner được gọi.

## Backend Cần Làm

Backend nên own toàn bộ flow quan trọng về security:

- Check inviter đã authenticated.
- Check inviter là workspace `owner`.
- Check email được invite thuộc về một active system user.
- Reject inactive user.
- Reject system admin invite vào workspace content nếu team giữ strict rule admin/user separation. `^[inferred]`
- Reject duplicate active member.
- Tạo pending invitation.
- Generate secure random token.
- Chỉ lưu token hash, không lưu raw token.
- Set expiry, ví dụ 7 ngày.
- Gửi email qua email pipeline hiện tại.
- Expose current-user invitation endpoints cho FE.
- Khi Accept, tạo/reactivate active workspace membership.
- Khi Decline, mark invitation declined.
- Giữ rule không được remove/hạ role last owner.
- Không grant workspace content access cho tới khi membership active.
- Không để AI service quyết định invitation hoặc permission.

Các file/module có khả năng bị ảnh hưởng:

- `Domain/Entities/WorkspaceInvitation.cs`
- `Domain/Enums/WorkspaceInvitationStatus.cs`
- `Data/InsightVaultDbContext.cs`
- `Data/Migrations/*`
- `DTOs/Workspaces/*` hoặc `DTOs/Invitations/*`
- `Application/Abstractions/Services/Workspaces/*`
- `Application/Services/Workspaces/WorkspaceService.cs`
- New `Application/Services/Workspaces/WorkspaceInvitationService.cs`
- New `Controllers/WorkspaceInvitationsController.cs`
- `Application/Abstractions/Services/Emails/IEmailService.cs`
- `Infrastructure/Emails/MessagingEmailService.cs`
- `Application/Services/Auth/AuthService.cs`
- `Infrastructure/Persistence/Repositories/*` nếu dùng repository pattern cho invitations

## Frontend Cần Làm

Với flow giống GitHub, FE cần làm invitation UI:

- Invite form của owner gọi `POST /api/workspaces/{workspaceId}/invitations`.
- Sau khi invite thành công, FE show "Invitation sent".
- Email `View invitation` trỏ tới FE route, ví dụ `/invitations/{invitationId}`.
- Thêm page `/invitations` để current user xem các lời mời pending trong 7 ngày.
- Thêm page `/invitations/{invitationId}` để xem chi tiết lời mời.
- Nếu chưa login, redirect sang login và giữ `returnUrl`.
- Sau login, FE gọi `GET /api/me/workspace-invitations/{invitationId}`.
- Nếu invitation đúng current user và còn pending, FE hiện Accept/Decline.
- Accept gọi `POST /api/me/workspace-invitations/{invitationId}/accept`.
- Decline gọi `POST /api/me/workspace-invitations/{invitationId}/decline`.
- Sau Accept, FE có thể redirect sang workspace detail.

## Email Behavior

Email nên do backend gửi, không phải frontend.

Lý do:

- FE không được giữ SMTP/provider credentials.
- FE không đáng tin để enforce owner/member permission.
- Backend mới own permission checks, token generation, persistence và membership changes.

Nội dung email nên có:

- Tên người mời.
- Tên workspace.
- Role được mời.
- Thời hạn invite.
- Nút `View invitation`.
- Fallback copy/paste link.
- Note email/account nào là người được mời.

Lưu ý security:

- "Button" trong email thực chất nên hiểu là link.
- Email không nên chứa Accept/Decline trực tiếp nếu muốn giống GitHub.
- Tránh state-changing `GET` link.
- Nút trong email nên mở FE invitation page.
- Accept/Decline phải gọi Backend bằng JWT current user.
- Backend phải verify `invited_user_id == currentUserId`.
- Cách này tránh việc email scanner/preview bot tự mở link rồi vô tình accept/decline.

## Business Rules

Rules bắt buộc:

- Chỉ active workspace `owner` được invite members.
- `editor` không được invite/remove members.
- `viewer` không được invite/remove members.
- Email được invite phải thuộc về một active user account trong hệ thống.
- Pending invite không được truy cập folder, document, chunks, chat, reports, compare, upload, download hoặc workspace content.
- Chỉ active `workspace_members` mới grant workspace content permission.
- System `admin` không được truy cập workspace content.
- Existing active member không được invite lại.
- Removed member có thể được invite lại.
- User chỉ trở thành active member sau khi Accept.
- Decline không tạo active membership.
- Expired invitation không được Accept.
- Token phải single-use.
- Token chỉ nên lưu dưới dạng hash.
- Invitation status nên idempotent ở mức hợp lý:
  - Accept invite đã accepted thì trả accepted state.
  - Decline invite đã declined thì trả declined state.
  - Accept invite đã declined/expired nên fail với conflict.

## Impact Analysis

Backend impact: medium.

- Cần thêm table/entity/migration.
- Cần thêm invitation service/controller.
- Cần đổi behavior invite member hiện tại.
- Cần đổi behavior auto-activate invited membership khi Google login.
- Cần test invitation lifecycle.

Frontend impact: medium.

- FE cần thêm route/page `/invitations` và `/invitations/{invitationId}` để giống GitHub.
- Medium nếu invite API response đổi từ `WorkspaceMemberDto` sang invitation DTO.
- Medium nếu FE cần hiển thị pending invitations trong workspace member/settings view.

Database/team impact: medium.

- Cần commit migration mới.
- Local Docker Postgres của mỗi người cần apply migration.
- Dữ liệu `Invited` cũ từ flow hiện tại cần team chốt cách xử lý.

Chat/RAG impact: low.

- Chat/RAG đang dựa trên active workspace permission.
- Pending invitation không được dùng chat.
- Không cần đổi Chat API contract.

## Migration/Rollout Plan

1. Team xác nhận chấp nhận flow invite mới.
2. Team xác nhận response của invite API có được đổi từ `WorkspaceMemberDto` sang invitation DTO không.
3. Thêm entity/table `workspace_invitations`.
4. Thêm enum invitation status.
5. Thêm EF Core migration.
6. Update `WorkspaceService.AddMemberAsync` hoặc tách dedicated invitation service.
7. Dừng auto-activate invited memberships khi Google login.
8. Update email service để gửi invitation links.
9. Thêm current-user invitation endpoints cho FE.
10. Thêm tests.
11. Update `API_CONTRACT_MVP.md` sau khi route/DTO chính thức được approve.
12. Coordinate với FE nếu response shape hoặc pending invite display thay đổi.

## Test Plan

Automated tests cần thêm:

- Owner invite được existing active user.
- Owner không invite được unknown email.
- Owner không invite được inactive user.
- Editor không invite được.
- Viewer không invite được.
- Admin không dùng invite để access workspace content.
- Duplicate active member invite trả conflict.
- Duplicate pending invite trả conflict hoặc resend result tùy team quyết định.
- Removed member có thể được invite lại.
- Pending invite không access được workspace content.
- Accept tạo/reactivate active membership.
- Decline không tạo active membership.
- Expired invitation không accept/decline được.
- Wrong current user không xem/accept/decline được invitation.
- Login không còn auto-activate pending invites.

Manual tests:

- Invite existing user và verify email tới inbox.
- Mở email `View invitation` link.
- Nếu chưa login, login đúng account được mời.
- Accept trong FE invitation page; workspace xuất hiện.
- Decline trong FE invitation page; workspace không xuất hiện.
- Thử old/expired invitation.
- Thử invite bằng non-owner.

Verification commands:

```powershell
dotnet test backend\InsightVault.API.Tests\InsightVault.API.Tests.csproj
docker compose -f infra\docker-compose.yml ps
```

Không chạy `docker compose down -v` trừ khi team chủ động muốn xóa local data volumes.

## Các Quyết Định Team Cần Chốt

- `POST /api/workspaces/{workspaceId}/members` nên tiếp tục return `WorkspaceMemberDto`, hay đổi sang `WorkspaceInvitationDto`?
- FE có làm page `/invitations` và `/invitations/{invitationId}` trong cùng sprint không?
- Pending invitations có cần xuất hiện trong workspace member/settings view không?
- Owner có cần thấy denied invitations không?
- Owner có được resend pending invite không?
- Invite expiry là bao lâu? Gợi ý: 7 ngày.
- Có reject system admin account khi được invite vào workspace không?
- Link email dùng `invitationId` hay token random?
- Có bắt buộc user login đúng account trước khi Accept/Decline không? Khuyến nghị: có, để giống GitHub.
- Các row `Invited` cũ hiện có trong DB sẽ migrate/handle như thế nào?
