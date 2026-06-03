# InsightVault AI - Chi Tiết Tính Năng MVP

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
| Background Processing | `.NET BackgroundService + ai_jobs`; RabbitMQ optional |
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
- `admin`: giám sát user, document, AI jobs và lỗi xử lý.

Admin không thay thế quyền workspace member. Admin dùng cho dashboard quản trị và monitoring.

### 3.3. Phân Quyền Workspace

MVP có co-work cơ bản thông qua bảng `workspace_members`.

Workspace role:

- `owner`: quản lý workspace, member, folder, document, AI features và report.
- `editor`: tạo folder, upload document, hỏi AI, compare document, tạo report.
- `viewer`: xem workspace, folder, document, summary, report và hỏi AI trong phạm vi workspace được phép đọc.

Quy tắc bắt buộc:

- Mọi API nghiệp vụ cần JWT hợp lệ.
- Mọi truy vấn workspace/folder/document/chunk/report phải kiểm tra membership.
- Quyền truy cập dựa trên `workspace_members`, không chỉ dựa vào `workspaces.owner_id`.

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

Folder dùng để phân loại tài liệu trong workspace.

Features:

- Tạo folder trong workspace.
- Xem danh sách folder.
- Xem chi tiết folder.
- Cập nhật tên và mô tả folder.
- Xóa folder.

Ví dụ folder:

- Research Papers.
- Requirements.
- Project Documents.
- Meeting Notes.
- Reports.

Tên folder trong cùng một workspace bắt buộc là duy nhất đối với các folder đang active.

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

## 7. Background Job Và Queue Processing

Xử lý tài liệu và tác vụ AI có thể mất nhiều thời gian, nên không xử lý trực tiếp trong request upload.

MVP mặc định:

```text
PostgreSQL ai_jobs table + .NET BackgroundService
```

RabbitMQ là optional nếu team muốn điểm system design tốt hơn:

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

RAG Chat cho phép user hỏi đáp dựa trên tài liệu đã upload.

Scope hỗ trợ:

- Workspace.
- Folder.
- Document.

Luồng xử lý:

```text
User nhập câu hỏi
-> Backend tạo chat message
-> AI service tạo embedding cho câu hỏi
-> pgvector tìm chunks liên quan theo đúng scope và permission
-> Gửi context + câu hỏi sang Gemini API
-> Gemini trả lời dựa trên context
-> Lưu câu trả lời vào chat_messages
-> Lưu sources vào sources_json
```

Features:

- Tạo chat session.
- Lưu chat history.
- Hiển thị câu hỏi và câu trả lời.
- Hiển thị source/citation.
- Retrieval luôn filter theo workspace membership.

## 11. Document Comparison

User chọn 2 hoặc nhiều document để AI so sánh.

Kết quả compare nên gồm:

- Mục tiêu.
- Phạm vi.
- Điểm giống nhau.
- Điểm khác nhau.
- Missing information.
- Potential conflicts.
- Recommendation.

Trong MVP, kết quả compare lưu vào `reports` với:

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
- Xem lại report đã tạo.
- Xóa report.

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
- RAG retrieval phải filter theo workspace/folder/document scope.
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
- Billing/payment.
- Fine-tuning model.
- Phân quyền chi tiết theo folder/document.

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
8. RAG chat theo document/folder/workspace.
9. Compare documents.
10. Generate Markdown report.
11. Dashboard cơ bản.
12. Admin monitoring cơ bản.
