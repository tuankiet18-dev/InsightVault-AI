# Báo cáo cập nhật tính năng (Workspace & Roles)

Dưới đây là các tính năng và logic liên quan đến Workspace và Phân quyền (Roles) đã được tích hợp với Backend thật để bạn có thể nắm bắt và đồng bộ khi phát triển tiếp các phần Frontend khác (UI/Panels):

## 1. Tích hợp API thật cho Workspace & Folder
- Đã gỡ bỏ hoàn toàn MSW mock handlers cho hai route `/workspaces` và `/folders`. Dữ liệu hiện tại được lấy trực tiếp từ Backend (.NET).
- Các logic lấy danh sách, tạo mới ở trang `UserDashboardPage` và `AppShell` đã được chuyển sang dùng React Query (`useWorkspaces` và `useFolders`). Khi có tác vụ Create/Delete, React Query sẽ tự động invalidate cache để UI đồng bộ (không cần state riêng hay reload).

## 2. Hệ thống phân quyền UI theo Role (Role-Based Access)
- Không còn dùng Role giả lập trên Topbar nữa. Role thực tế của người dùng hiện tại (`currentUserRole`) được trích xuất từ dữ liệu trả về trong `WorkspaceDto`.
- Mọi logic ẩn/hiện các chức năng thao tác (Destructive / Administrative) đều được kiểm tra thông qua hàm `hasPermission(role, action)` ở `src/utils/permission.ts`.
- **Cụ thể các giới hạn hiện tại:**
  - `owner`: Có toàn quyền. Nhìn thấy nút Invite, Upload, Tạo Folder, Đổi tên/Xoá Folder.
  - `editor`: Không nhìn thấy nút Invite (Mời thành viên) hoặc Xoá Workspace, nhưng vẫn nhìn thấy và thao tác được tính năng Upload, Tạo Folder, Xoá Folder.
  - `viewer`: Các nút Invite, Upload, Tạo Folder, Rename/Delete (dấu 3 chấm ở Explorer) sẽ tự động bị ẩn.

## 3. Quản lý thành viên (Invite Members Modal)
- Đã tạo hook mới `src/hooks/useWorkspaceMembers.ts` bọc các API trong `workspaceApi.ts`.
- **Hiển thị:** Form chức năng Mời thành viên được bọc trong Component `InviteMemberModal.tsx` (được mount trong `src/components/layout/AppShell.tsx` và điều khiển qua `useUiStore` `setInviteModalOpen`).
- **Thêm thành viên:** Bắn Mutation `useAddWorkspaceMember` (Email + Role) lên backend. Backend sẽ tự động lo logic kiểm tra tài khoản, gửi email. Frontend xử lý bắt lỗi và hiện Toast Message tương ứng.
- **Danh sách Real-time:** Bên trong Modal cũng render một danh sách các thành viên hiện tại thông qua `useWorkspaceMembers`. Danh sách này tự động Invalidate Query khi có member mới được invite thành công.

