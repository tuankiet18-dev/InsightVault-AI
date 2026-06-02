# Phân công Frontend - Refactor Knowledge IDE

Tài liệu này chia việc cho 3 FE để làm song song với ít conflict nhất. Nguyên tắc chính: mỗi bạn sở hữu một vùng code rõ ràng, mọi thay đổi vào file dùng chung phải được báo trước trong group.

## Mục tiêu chung

- User dùng `/dashboard` để chọn workspace.
- User vào IDE qua `/workspaces/:workspaceId`.
- IDE dùng dữ liệu thật/mock API qua `api/*`, `hooks/*`, `stores/workspaceStore.ts`; không tạo store seed-data riêng.
- Admin vào `/admin`, `/admin/users`, `/admin/jobs` và bắt buộc `user.systemRole === 'admin'`.
- Quyền workspace lấy từ `WorkspaceDto.currentUserRole`.

## Ranh giới file dùng chung

Các file dưới đây chỉ một người được sửa chính trong từng giai đoạn:

| File/vùng | Owner | Quy tắc |
| --- | --- | --- |
| `src/app/router.tsx` | Nguyên | Phú/An cần route mới thì báo Nguyên thêm. |
| `src/components/auth/ProtectedRoute.tsx` | Nguyên | Chỉ Nguyên sửa logic auth/system role. |
| `src/pages/WorkspacePage.tsx` | Phú | Là điểm lắp layout IDE và tab content. |
| `src/stores/workspaceStore.ts` | Phú | Chỉ lưu UI state workspace hiện tại, không fetch API trong store. |
| `src/stores/tabStore.ts` | Phú | An cần tab type mới thì thống nhất contract trước. |
| `src/components/layout/*` | Phú | Layout shell, topbar, rail, status bar. |
| `src/components/explorer/*` | Phú | Folder/document tree và role-based actions. |
| `src/components/ai/*`, `src/components/chat/*`, `src/components/compare/*`, `src/components/document/ReportViewer.tsx` | An | Các panel tính năng trong IDE. |
| `src/components/admin/*`, `src/pages/AdminPage.tsx`, admin subpages | Nguyên | Admin portal và admin tables. |

## Phú - Core IDE & Workspace Layout

Trách nhiệm: khung IDE, workspace state, explorer, tab shell, quyền theo workspace role.

### Task

1. Hoàn thiện `WorkspacePage.tsx`
   - Đọc `workspaceId` từ URL.
   - Set `activeWorkspaceId` trong `workspaceStore`.
   - Gọi `useWorkspace(workspaceId)` để validate workspace.
   - Render `AppShell`, `TabStrip`, `DocumentViewer`, `ReportViewer`, `ComparePanel`.

2. Chuẩn hóa layout IDE
   - Sở hữu `src/components/layout/*`.
   - Đảm bảo layout 3 vùng: Explorer, Workbench, AI Inspector.
   - Không tạo layout duplicate trong `src/components/workspace/*` nếu layout đó trùng `components/layout/*`.

3. Role-based UI trong workspace
   - `viewer`: không thấy Upload, Delete Folder, Delete Document.
   - `editor`: thấy Upload, không thấy Invite/Workspace destructive settings.
   - `owner`: thấy Upload, Invite, workspace-level settings/destructive actions.

4. Explorer
   - Sở hữu `src/components/explorer/*`.
   - Folder/document actions phải dùng API hooks hiện có.
   - Không dùng mock/seed local riêng trong explorer.

### Không sửa

- Không sửa admin route/ProtectedRoute.
- Không implement chat/compare/report logic sâu, chỉ lắp panel do An cung cấp.

## Nguyên - Admin Portal & System Routing

Trách nhiệm: routing, route protection, admin dashboard/users/jobs.

### Task

1. Route protection
   - `ProtectedRoute` hỗ trợ `requireAdmin`.
   - Route `/admin/*` phải redirect user thường về `/dashboard`.
   - Không check admin bằng UI-only condition.

2. Admin layout
   - Tạo layout riêng cho admin, không dùng workspace `AppShell`.
   - Nav gồm Dashboard, Users, AI Jobs.

3. Admin Dashboard
   - Dùng `adminApi.getDashboard()` hoặc endpoint admin phù hợp khi backend sẵn sàng.
   - Hiển thị tổng workspace, users, documents, reports, AI jobs.

4. Admin Users
   - Dùng `adminApi.getUsers()`.
   - Có search/filter trạng thái.
   - Toggle block/unblock bằng `adminApi.updateUser()`.

5. Admin Jobs
   - Dùng `adminApi.getAllAiJobs()`.
   - Highlight `failed`, hiển thị `errorMessage`.
   - Có filter theo `status` và `jobType`.

### Không sửa

- Không sửa `components/layout/*` của workspace IDE.
- Không đổi tab/workspace store nếu không thống nhất với Phú.

## An - IDE Features & AI Panels

Trách nhiệm: chat/RAG, compare, report/document rendering bên trong IDE.

### Task

1. AI Inspector / Chat Panel
   - Sở hữu `src/components/ai/*` và `src/components/chat/*`.
   - Dùng `activeWorkspaceId`, `selectedFolderId`, `selectedDocumentId` từ `workspaceStore`.
   - Dùng `chatApi.ts` và hooks hiện có; không tạo chat seed store riêng.
   - Hiển thị sources/citations rõ ràng.

2. Compare Panel
   - Sở hữu `src/components/compare/*`.
   - Chỉ cho chọn document `completed`.
   - Gọi `reportApi.compareDocuments` qua hook.
   - Có empty/loading/error states.

3. Document Viewer
   - Cải thiện `src/components/document/DocumentViewer.tsx` và các component con.
   - Nhận document từ active tab, gọi `useDocument(documentId)`.
   - Hiển thị summary, key points, keywords, processing/failed state.

4. Report Viewer
   - Render Markdown bằng `react-markdown` + `remark-gfm`.
   - Chuẩn hóa trạng thái loading/not found.
   - Không tự parse markdown bằng split string.

### Không sửa

- Không sửa route chính.
- Không tự thay workspace role hoặc active workspace bằng local state riêng.

## Git flow đề xuất

- Phú: `feature/core-ide-layout`
- Nguyên: `feature/admin-routing-portal`
- An: `feature/ide-ai-panels`

Thứ tự merge khuyến nghị:

1. Phú merge trước phần `WorkspacePage`, `layout`, `workspaceStore`, `explorer`.
2. Nguyên merge routing/admin protection ngay sau đó, vì đụng `router.tsx`.
3. An rebase lên branch đã có core IDE rồi lắp các panel vào tab/right panel.

## Checklist trước khi tạo PR

- Chạy `npm run lint`.
- Chạy `npm run build`.
- Kiểm tra login redirect về `/dashboard`.
- Kiểm tra user thường không vào được `/admin`.
- Kiểm tra `/workspaces/:workspaceId` đổi workspace đúng theo URL.
- Kiểm tra role viewer không thấy upload/delete/invite.
- Không có component/layout duplicate chạy bằng seed data riêng.
