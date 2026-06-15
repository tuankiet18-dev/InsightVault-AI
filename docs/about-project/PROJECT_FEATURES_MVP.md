# InsightVault AI - Chi Tiết Tính Năng MVP

Current status note, 2026-06-15: use
`docs/about-project/CURRENT_PROJECT_STATUS.md` as the live implementation
anchor. Most backend/infra MVP flows are implemented. Backend Chat/RAG APIs
remain the largest feature gap; frontend billing UI now has a first
implementation.

## 1. Tổng Quan

**InsightVault AI** là một collaborative AI-powered knowledge workspace giúp nhóm project quản lý tài liệu chung, xử lý tài liệu thành knowledge base, hỏi đáp bằng RAG, so sánh tài liệu, phát hiện gap/conflict và tạo báo cáo Markdown.

MVP tập trung vào luồng giá trị chính:

```text
Login -> Shared workspace -> Invite member -> Upload documents
-> Process/chunk/embed -> Summary -> RAG chat
-> Compare/gap detection -> Generate Markdown report -> Admin monitoring
```

## 2. Tech Stack MVP

| Thành phần | Công nghệ |
|---|---|
| Frontend | React Vite, Tailwind CSS |
| Backend | ASP.NET Core Web API |
| Authentication | Google OAuth, JWT nội bộ |
| Database | PostgreSQL |
| Vector Search | pgvector |
| File Storage | MinIO |
| Background Processing | `.NET BackgroundService + ai_jobs + RabbitMQ` |
| AI Service | Python service |
| AI Provider | Gemini API |
| Embedding Model | Gemini Embedding API |

## 3. Authentication Và Authorization

### 3.1. Đăng Nhập Bằng Google OAuth

Người dùng đăng nhập bằng tài khoản Google. Hệ thống không lưu mật khẩu riêng.

```text
User chọn Login with Google
-> Google OAuth xác thực user
-> Backend nhận Google identity
-> Backend tạo mới hoặc cập nhật user
-> Backend phát hành JWT nội bộ
-> Frontend dùng JWT để gọi API
```

Dữ liệu user cần lưu:

- Email.
- Full name.
- Avatar URL.
- Google subject.
- Role hệ thống: `user` hoặc `admin`.
- Trạng thái active.
- Thời gian đăng nhập gần nhất.

### 3.2. Phân Quyền Hệ Thống

Hệ thống có 2 role cấp hệ thống:

- `user`: sử dụng các chức năng chính.
- `admin`: giám sát user, AI jobs và lỗi hệ thống. Admin không được xem/truy cập nội dung workspace, folder, document, chunks, chat, report của người dùng.

Admin không thay thế quyền workspace member. Admin dùng cho dashboard quản trị và monitoring.

### 3.3. Phân Quyền Workspace

MVP có co-work cơ bản thông qua bảng `workspace_members`.

Workspace role:

- `owner`: quản lý workspace, member, folder, document, AI features, report và trash.
- `editor`: tạo folder, upload document, hỏi AI, compare document, tạo report và xóa/khôi phục document do chính mình upload.
- `viewer`: xem workspace/folder/document metadata, xem summary/report đã có và hỏi AI/RAG trong phạm vi được phép đọc. Viewer không upload, compare, generate report, delete, hard delete hoặc download file gốc trong MVP.

Quy tắc bắt buộc:

- Mọi API nghiệp vụ cần JWT hợp lệ.
- Mọi truy vấn workspace/folder/document/chunk/report phải kiểm tra membership.
- Quyền truy cập dựa trên `workspace_members`, không chỉ dựa vào `workspaces.owner_id`.
- Member ở trạng thái `invited` chỉ thấy sự tồn tại của workspace/invitation, không thấy folder, document, chunks, chat hoặc report cho tới khi active.
- Editor không có quyền invite/remove member.
- Owner transfer không bắt buộc trong MVP; có thể để phase sau.

## 4. Workspace Và Co-work

Workspace là không gian làm việc chung của một project, môn học hoặc chủ đề nghiên cứu.

### 4.1. Workspace Features

- Tạo workspace.
- Xem danh sách workspace mà user là member.
- Xem chi tiết workspace.
- Cập nhật tên/mô tả workspace.
- Xóa workspace nếu là owner.
- Cấu hình `ai_system_prompt` riêng cho workspace.

### 4.2. Member Features

- Owner mời member bằng email.
- Xem danh sách member.
- Đổi role member.
- Xóa member khỏi workspace.

### 4.3. Giới Hạn MVP

- Không làm realtime editing.
- Không làm cursor presence.
- Không làm realtime team chat.
- Không làm phân quyền chi tiết theo từng folder/document.

## 5. Folder Management

Folder dùng để phân loại tài liệu trong một workspace. Workspace mới là boundary cộng tác và permission chính; folder không đại diện cho một nhóm member riêng trong MVP.

Ví dụ:

```text
Workspace: SWD391
Folders: HK1, FinalExam, Project Docs, Meeting Notes
```

Features:

- Tạo folder trong workspace.
- Folder hỗ trợ nhiều cấp qua `parentFolderId`.
- Xem danh sách folder theo parent.
- Xem chi tiết folder.
- Cập nhật tên và mô tả folder.
- Xóa folder bằng soft delete.
- Dùng folder như nguồn mention trong chat bằng `@folder`.

Business rules:

- Permission vẫn theo workspace role `owner/editor/viewer`.
- Không làm folder-level member visibility trong MVP.
- Tên folder chỉ cần unique giữa các folder active có cùng parent trong cùng workspace.
- `@folder` trong RAG sẽ include documents trong folder đó và subfolders mặc định.
- Backend resolve `@folder` thành danh sách `document_ids` trước khi gọi AI.
- Khi soft delete folder cha, backend soft delete toàn bộ folder con và documents nằm trong cây folder đó.
- Soft-deleted folders/documents phải bị loại khỏi mọi list, mention resolution, compare/report source resolution và RAG retrieval.

## 6. Document Upload Và Management

Document là tài liệu người dùng upload vào folder.

### 6.1. Định Dạng Hỗ Trợ

- PDF text-based.
- DOCX.
- TXT.
- Markdown.

MVP chưa hỗ trợ OCR cho file scan hoặc ảnh chụp.

### 6.2. Features

- Upload document vào folder.
- Validate file type.
- Validate file size.
- Lưu file gốc vào MinIO.
- Lưu metadata vào PostgreSQL.
- Xem danh sách document theo folder.
- Xem chi tiết document.
- Xóa document.
- Trash UI/API cho document.
- Xem trạng thái xử lý document.
- Xem lỗi xử lý nếu document failed.

### 6.3. Document Status

```text
pending_upload
uploaded
processing
completed
failed
```

Ý nghĩa:

- `pending_upload`: backend đã tạo metadata và presigned URL, nhưng file chưa được confirm upload.
- `uploaded`: file đã upload và metadata đã lưu.
- `processing`: hệ thống đang extract text, chunking và tạo embedding.
- `completed`: document đã xử lý xong và có thể dùng cho AI.
- `failed`: xử lý thất bại.

### 6.4. Delete, Trash Và File Name Rules

- Không cho phép duplicate file name trong cùng một folder nếu document cũ chưa bị soft delete.
- Soft delete document sẽ đưa document vào Trash và set `deleted_at`; MinIO object chưa bị xóa ngay.
- Soft-deleted document phải bị loại khỏi list thường, source mention, compare/report source resolution và RAG retrieval.
- Chunks của soft-deleted document không cần xóa vật lý ngay, nhưng phải bị ẩn bằng filter theo `documents.deleted_at IS NULL`.
- Hard delete chỉ thực hiện từ Trash. Khi hard delete thì xóa metadata, chunks và MinIO object.
- Owner được soft delete, restore và hard delete mọi document trong workspace.
- Editor chỉ được soft delete, restore và hard delete document do chính Editor đó upload.
- Viewer không được delete, restore hoặc hard delete document, kể cả document trước đây do Viewer đó upload.

## 7. Background Job Và Queue Processing

Xử lý tài liệu và tác vụ AI có thể mất nhiều thời gian, nên không xử lý trực tiếp trong request upload.

MVP mặc định:

```text
PostgreSQL ai_jobs table + .NET BackgroundService
```

RabbitMQ is implemented in the local Docker stack and used for document
processing, AI jobs, and email queueing:

```text
ASP.NET Web API -> RabbitMQ -> Worker -> PostgreSQL
```

Dù dùng cách nào, vẫn giữ bảng `ai_jobs` để tracking trạng thái thật.

Job types:

```text
process_document
generate_report
compare_documents
```

Job status:

```text
queued
processing
completed
failed
cancelled
```

## 8. Document Processing Pipeline

```text
Read file from MinIO
-> Extract text
-> Clean text
-> Split text into chunks
-> Count tokens
-> Generate embeddings with Gemini Embedding API
-> Store chunks and embeddings in PostgreSQL + pgvector
-> Generate document summary/key points/keywords
-> Update document status
```

Chunk cần lưu:

- Document ID.
- Chunk index.
- Content.
- Token count.
- Embedding vector.
- Metadata.

Vector được lưu bằng pgvector, ví dụ:

```sql
embedding vector(768)
```

## 9. Document Summary

Sau khi document xử lý xong, AI tạo:

- Summary.
- Key points.
- Keywords.

Tính năng này giúp user nắm nhanh nội dung chính của tài liệu mà không cần đọc toàn bộ file.

## 10. RAG Chat

RAG Chat cho phép user hỏi đáp dựa trên tài liệu đã upload trong workspace.

Business rule mới:

- Một chat session thuộc một workspace.
- Nếu user không mention nguồn cụ thể, câu hỏi sẽ retrieve trên toàn workspace.
- User có thể mention nguồn để giới hạn retrieval:
  - `@file`: hỏi dựa trên một document cụ thể.
  - `@folder`: hỏi dựa trên tất cả document trong folder đó và subfolders.
- Folder chỉ là cách tổ chức và chọn nguồn, không phải permission boundary riêng.

Luồng xử lý:

```text
User nhập câu hỏi, có thể kèm @file hoặc @folder
-> Backend tạo user chat message
-> Backend kiểm tra workspace role owner/editor/viewer
-> Backend resolve @file/@folder thành explicit document_ids nếu có mention
-> Backend gọi AI service /rag/query với workspace hoặc document_ids đã resolve
-> AI service tạo embedding cho câu hỏi
-> pgvector tìm chunks liên quan trong đúng retrieval set
-> Gửi context + câu hỏi sang Gemini API
-> Gemini trả lời dựa trên context
-> Backend lưu assistant message và citation sources
```

Features:

- Tạo chat session trong workspace.
- Lưu chat history.
- Hỗ trợ `@file` và `@folder` mention trong message.
- Validate workspace role `owner/editor/viewer`.
- User chỉ truy cập dữ liệu trong workspace mà họ là member.
- Backend deduplicate resolved `document_ids` trước khi gọi AI.
- Chỉ document `completed` mới được dùng cho RAG. Document chưa completed phải bị chặn hoặc cảnh báo trong UI.
- RAG chat không tạo `ai_jobs` để tránh sinh quá nhiều job nhỏ.
- Web search chưa nằm trong MVP; contract có thể giữ placeholder nhưng UI nên disable.
- Không expose MinIO object public trực tiếp.
- Không gửi quá nhiều document context sang Gemini API nếu không cần.

## 11. Document Comparison

User chọn 2 hoặc nhiều document để AI so sánh. Compare là user-triggered, không tự chạy sau upload trong MVP.

Kết quả compare nên gồm:

- Mục tiêu.
- Phạm vi.
- Điểm giống nhau.
- Điểm khác nhau.
- Missing information.
- Potential conflicts.
- Recommendation.

Compare nên chạy async qua `ai_jobs` vì có thể mất thời gian gọi LLM và tránh giữ request HTTP quá lâu. Kết quả compare lưu vào `reports` với:

```text
report_type = comparison_report
```

Không cần bảng `compare_results` riêng.

## 12. Gap Và Conflict Detection

Tính năng này thực hiện trong lúc compare document hoặc generate report.

AI có thể phát hiện:

- Tài liệu A có nội dung mà tài liệu B không đề cập.
- Hai tài liệu mô tả khác nhau về cùng một chức năng.
- Report thiếu nội dung đã có trong proposal/requirement.
- Recommendation để điều chỉnh.

## 13. Report Generation

Report có thể tạo từ:

- Một document.
- Một folder.
- Nhiều document được chọn.
- Một workspace.

Report types MVP:

- Summary report.
- Comparison report.
- Gap analysis report.
- Section report.

Features:

- Tạo report bằng Gemini API.
- Lưu report dạng Markdown.
- Lưu source document IDs.
- Hỗ trợ tạo report theo folder bằng cách backend resolve folder/subfolders thành danh sách document IDs.
- Report có versioning: cùng một report có thể có nhiều phiên bản để dễ kiểm chứng lịch sử.
- Xem lại report đã tạo.
- Xóa report.

Permission:

- Owner và Editor được tạo report.
- Chỉ Owner được delete report.
- Backend là bên persist report; AI service không tự ghi bảng `reports`.

Giới hạn MVP:

- Chưa export PDF.
- Chưa export DOCX.
- Chưa cần rich text editor phức tạp.

## 14. Dashboard

User dashboard:

- Tổng số workspace.
- Tổng số folder.
- Tổng số document.
- Số document đang processing.
- Số document completed.
- Số document failed.
- Số report đã tạo.
- Job gần đây.
- Activity gần đây trong workspace nếu kịp làm.

Admin dashboard:

- Tổng số user.
- Tổng số document toàn hệ thống.
- Tổng số workspace.
- Tổng số AI job.
- Job queued/processing/failed.
- Lỗi xử lý gần đây.

## 14.1. Billing, Subscription, And AI Credits

Billing is now part of the implemented backend scope.

Features:

- Workspace-scoped monthly plans.
- One-time AI credit top-up packages.
- Shared workspace credit balance for all active members.
- Credit guard for document processing, report generation, and document
  comparison.
- PayOS checkout creation and webhook verification.
- Immutable credit ledger for grants, debits, refunds, and adjustments.

Frontend billing screens are implemented for workspace billing summary, plan
selection, credit top-ups, and checkout success/cancel states.

## 15. Admin Features

Admin dùng để giám sát hệ thống.

MVP features:

- Xem danh sách user.
- Khóa hoặc mở user bằng `is_active`.
- Xem thống kê document/job.
- Xem danh sách job failed.
- Xem lỗi xử lý cơ bản.

Admin không cần sửa nội dung document của user, impersonate user, billing hoặc quota phức tạp trong MVP.

## 16. Search Và Filtering

Search cơ bản:

- Tìm workspace theo tên.
- Tìm folder theo tên.
- Tìm document theo tên.

Filter document:

- Theo folder.
- Theo file type.
- Theo status.
- Theo ngày upload.

Semantic search được thực hiện thông qua RAG Chat. MVP chưa cần trang semantic search riêng.

## 17. Error Handling

Lỗi upload:

- File type không được hỗ trợ.
- File quá lớn.
- Upload lên MinIO thất bại.

Lỗi processing:

- Không extract được text.
- Gemini API lỗi.
- Embedding request lỗi.
- Lưu vector thất bại.

Cách xử lý:

- Lưu error message vào database.
- Cập nhật status thành `failed`.
- Cho phép retry job.
- Hiển thị lỗi thân thiện cho user.

## 18. Security Và Data Protection

- Tất cả API nghiệp vụ cần JWT.
- Validate system role `user/admin`.
- Validate workspace role `owner/editor/viewer`.
- User chỉ truy cập dữ liệu trong workspace mà họ là member.
- RAG retrieval phải filter theo workspace permission và explicit `document_ids` được resolve từ `@file` / `@folder` khi có mention.
- Không expose MinIO object public trực tiếp.
- Không gửi quá nhiều document context sang Gemini API nếu không cần.

## 19. Out Of Scope Cho MVP

- Realtime collaborative editing.
- Cursor presence.
- Realtime chat giữa members.
- OCR cho file scan.
- Mobile app native.
- Voice note.
- Obsidian plugin.
- Knowledge graph nâng cao.
- Version control document phức tạp.
- Export PDF/DOCX.
- Notification realtime.
- Fine-tuning model.
- Phân quyền chi tiết theo folder/document.
- Owner transfer giữa các workspace member.
- Virus/malware scan khi upload bằng ClamAV hoặc service tương tự.
- Tự động hard delete item trong Trash theo retention period.
- Viewer download file gốc.
- Restricted database user riêng cho AI service.

### 19.1. Deferred/Post-MVP Notes

- Virus scan nên chạy async sau upload và trước document processing. File nhiễm hoặc chưa scan sạch không được extract/chunk/embed.
- Owner transfer phải bảo đảm người nhận là active member và workspace luôn có đúng một Owner.
- Trash retention có thể dùng scheduled/background job để hard delete metadata, chunks và MinIO object sau thời hạn cấu hình. MVP chỉ hard delete thủ công.
- Các mục deferred ở trên không chặn việc implement hoặc nghiệm thu MVP hiện tại.

## 20. Luồng Demo Đề Xuất

```text
1. User đăng nhập bằng Google.
2. Tạo workspace "InsightVault AI Project".
3. Mời một member vào workspace.
4. Tạo folder "Project Documents".
5. Upload proposal và requirement.
6. Hệ thống xử lý document.
7. User xem summary từng document.
8. User hỏi AI: "MVP của dự án gồm những chức năng nào?"
9. User compare proposal với requirement.
10. AI phát hiện gap/conflict.
11. User generate Markdown report.
12. Admin xem job status/dashboard.
```

## 21. Tính Năng Tối Thiểu Để MVP Thành Công

1. Google OAuth login.
2. Shared workspace + member roles.
3. Folder management.
4. Upload document vào MinIO.
5. Background process document.
6. Chunking + embedding + pgvector.
7. Document summary.
8. RAG chat trong workspace, có `@file` và `@folder` để giới hạn nguồn.
9. Compare documents.
10. Generate Markdown report.
11. Dashboard cơ bản.
12. Admin monitoring cơ bản.
