# InsightVault AI - Đặc Tả Màn Hình UI/UX Theo Phong Cách Knowledge IDE

Trạng thái: đặc tả màn hình sẵn sàng để dựng prototype/frontend. Phong cách mục tiêu là Knowledge IDE, ưu tiên MVP desktop trước, responsive web sau, Flutter mobile nếu còn thời gian.

## Định Hướng Thiết Kế

- Loại sản phẩm: collaborative AI knowledge workspace.
- Phong cách: Knowledge IDE, không phải landing page.
- Cảm giác: nhiều thông tin nhưng gọn, tập trung, kỹ thuật, bình tĩnh, chuyên nghiệp.
- Mẫu layout: thanh điều hướng trái + explorer workspace + vùng làm việc tài liệu ở giữa + AI inspector bên phải.
- Typography: Plus Jakarta Sans trong app; Inter có thể dùng làm fallback nếu thiếu font.
- Bảng màu: nền slate trung tính, xanh dương làm màu chính, cyan/violet cho AI, xanh lá/cam/đỏ cho trạng thái.
- Tránh: hero marketing, card quá lớn, gradient trang trí, icon emoji, trạng thái chỉ phân biệt bằng màu.

## Mô Hình Điều Hướng

App shell chính:

```text
Left rail:
- Explorer
- Search
- AI / Chat
- Reports
- Admin Monitor

Topbar:
- Workspace switcher
- Command search
- Invite
- Upload
- User/theme controls

Main:
- Explorer panel
- Document tabs
- Document workbench
- AI inspector
- Status bar
```

## Danh Sách Màn Hình

### 01 Desktop - Knowledge IDE Workspace

Mục đích: màn hình làm việc chính của MVP.

Người dùng chính:
- Owner/editor quản lý tài liệu.
- Viewer đọc summary và hỏi AI.

Khu vực chính:
- Left rail: điều hướng toàn cục dạng icon-only.
- Explorer panel: workspaces, folders, documents, trạng thái AI job.
- Tab strip: các document/report/compare set đang mở.
- Document workbench: chi tiết tài liệu đang chọn.
- Right inspector: các chế độ Ask/Compare/Gap/Report.
- Status bar: role, retrieval scope, số lượng job.

Trạng thái cần có:
- Workspace rỗng.
- Documents đang tải.
- Document sẵn sàng.
- Document đang xử lý.
- Document lỗi và có retry.
- Viewer bị chặn thao tác do thiếu quyền.

UX quan trọng:
- Citation của RAG phải hiển thị gần câu trả lời.
- Document đang processing phải disable Compare/Report.
- Viewer thấy control bị disable kèm lý do ngắn gọn.

### 02 Modal - Luồng Upload Bằng Presigned URL

Mục đích: browser upload trực tiếp lên MinIO private bằng presigned URL do BE cấp.

Luồng xử lý:

```text
Chọn file
-> BE kiểm tra JWT + quyền owner/editor
-> BE tạo document trạng thái pending_upload
-> BE trả presigned PUT URL
-> FE upload file lên MinIO
-> FE gọi confirm-upload
-> BE kiểm tra object bằng StatObject
-> BE tạo job process_document
```

Thành phần UI:
- Folder selector.
- Dropzone.
- Validate file type/file size.
- Upload progress.
- Trạng thái đang confirm.
- Trạng thái thành công: processing queued.

Thông điệp bảo mật:
- "File được upload vào private storage. Quyền workspace được kiểm tra trước khi xử lý."

Trạng thái lỗi:
- File type không hỗ trợ.
- File quá lớn.
- Presigned URL hết hạn.
- Upload thành công nhưng confirm thất bại.
- Không tìm thấy object trong MinIO.

### 03 Screen - Multi-document RAG Chat

Mục đích: hỏi đáp theo workspace/folder/nhiều documents được chọn.

Khu vực chính:
- Source selector.
- Chat canvas.
- Citation panel.
- Web search control bị disable cho phase sau.

Scope controls:
- Workspace.
- Folder.
- Documents: multi-select document IDs.

Web search:
- Hiển thị toggle disable hoặc nhãn "Sẽ hỗ trợ sau".
- Contract đã có field: `webSearchOptions`, `web_search_options`.
- MVP chưa cần logic xử lý.

Hành vi trả lời:
- Nếu không tìm thấy context, hiển thị câu trả lời rỗng rõ ràng.
- Danh sách sources phải hiển thị document, chunk/snippet, similarity nếu có.
- Câu hỏi tiếp theo giữ chat history.

### 04 Screen - Compare Và Markdown Report

Mục đích: so sánh tài liệu, phát hiện gap/conflict, tạo report.

Khu vực chính:
- Compare set panel.
- Analysis output.
- Markdown report preview.

Các phần output của compare:
- Objectives.
- Scope.
- Similarities.
- Differences.
- Missing information.
- Potential conflicts.
- Recommendations.

Thao tác report:
- Save Markdown.
- Copy Markdown.
- Regenerate.
- View source documents.

Ranh giới MVP:
- Export PDF/DOCX nằm ngoài scope.
- UI phải ghi rõ điều này để tránh hiểu nhầm kỳ vọng.

### 05 Screen - Admin Monitor

Mục đích: màn hình vận hành/giám sát cho admin.

Khu vực chính:
- Metrics row.
- AI job table.
- Failed job detail.
- User list.

Metrics:
- Users.
- Workspaces.
- Documents.
- Processing docs.
- Failed jobs.
- Reports.

Thao tác admin:
- Khóa/mở user.
- Xem failed job.
- Retry failed job.
- Filter theo job status/type.

UX quan trọng:
- Failed job cần error message có thể hành động được.
- Retry phải disable nếu document đã bị xóa hoặc user không còn quyền workspace.

### 06 Mobile - Responsive Knowledge IDE

Mục đích: bản responsive web, chưa phải Flutter implementation đầy đủ.

Cấu trúc mobile:
- Topbar có workspace và upload.
- Search/ask input.
- Document cards.
- AI quick panel.
- Bottom nav.

Workflow ưu tiên trên mobile:
- Xem trạng thái document.
- Đọc summary.
- Hỏi current document.
- Xem report.
- Upload nếu khả thi.

Để dành cho phase Flutter:
- Layout compare nâng cao.
- Bảng admin dày dữ liệu.
- Full multi-panel IDE layout.

## Hướng Dẫn Component

Dùng nhất quán các component sau:

- App rail.
- Workspace switcher.
- Command search.
- Folder row.
- Document row.
- Status chip.
- Role badge.
- Upload dropzone.
- AI mode segmented control.
- Prompt input.
- Citation item.
- Markdown preview.
- Job table row.
- Empty state.
- Error alert.

## Quy Tắc Accessibility

- Không dùng màu làm tín hiệu duy nhất; status luôn cần text label.
- Lỗi phải có nội dung rõ ràng và dùng `role=alert` khi implement.
- Button và row cần focus state rõ.
- Text contrast tối thiểu 4.5:1.
- Row có thể click cần hover và cursor feedback.
- Target size trên mobile tối thiểu 44px.

## Quy Tắc Responsive

Desktop >= 1200px:
- Shell đủ 4 cột: rail, explorer, workbench, AI inspector.

Tablet 768-1199px:
- Rail + main.
- Explorer thu vào drawer.
- AI inspector chuyển thành side sheet hoặc bottom panel.

Mobile < 768px:
- Bottom navigation.
- Document cards một cột.
- AI panel nằm dưới document được chọn.
- Compare/report chuyển thành flow từng bước.

## Các Màn Hình Cần Dựng

```text
00 Design Notes / Screen Inventory
01 Desktop / Knowledge IDE Workspace
02 Modal / Presigned Upload Flow
03 Screen / Multi-document RAG Chat
04 Screen / Compare and Markdown Report
05 Screen / Admin Monitor
06 Mobile / Responsive Knowledge IDE
```

## Layout Đề Xuất

- Canvas background: `#F8FAFC`.
- Desktop frames: `1440 x 960`.
- Secondary desktop frames: `1040 x 720` hoặc `1080 x 760`.
- Mobile frame: `390 x 844`.
- Corner radius: app shell 16-18, cards 8-12, buttons 8.
- Dùng layout nhất quán cho list và panel lặp lại.

## Ghi Chú Handoff Cho FE

- Source DTOs: `frontend/src/types/api-contract.ts`.
- API contract: `docs/API_CONTRACT_MVP.md`.
- React mock hiện tại đã đi theo hướng Knowledge IDE trong `frontend/src/App.tsx`.
- Bước implement tiếp theo: tách mock thành reusable components và nối với BE API client.
