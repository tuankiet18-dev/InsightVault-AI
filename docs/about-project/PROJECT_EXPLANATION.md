# InsightVault AI - Tài liệu giải thích dự án cho team

Current status note, 2026-06-15: use
`docs/about-project/CURRENT_PROJECT_STATUS.md` as the live implementation
anchor. Backend billing/credits/PayOS, SMTP email queueing, and frontend
billing UI are now implemented; backend Chat/RAG APIs remain pending.

## 1. InsightVault AI là gì?

**InsightVault AI** là một nền tảng web giúp người dùng và nhóm project quản lý, phân tích và khai thác tri thức từ tài liệu bằng trí tuệ nhân tạo.

Có thể hiểu đơn giản:

```text
InsightVault AI = Shared Workspace + Document Management + AI Document Analysis
```

Người dùng có thể:

- Tạo workspace cho project.
- Mời thành viên vào workspace.
- Phân quyền thành viên.
- Tạo folder để phân loại tài liệu.
- Upload tài liệu như proposal, requirement, report, meeting note, paper nghiên cứu.
- Dùng AI để tóm tắt, hỏi đáp, so sánh và tạo báo cáo từ tài liệu.

Điểm quan trọng nhất:

```text
Dự án không chỉ lưu tài liệu.
Dự án giúp nhóm hiểu, so sánh và khai thác tri thức từ tài liệu.
```

## 2. Một câu pitch ngắn

Nếu cần giải thích thật nhanh, có thể nói:

```text
InsightVault AI là một shared workspace cho nhóm project, nơi các thành viên cùng quản lý tài liệu và dùng AI để tóm tắt, hỏi đáp, so sánh, phát hiện mâu thuẫn và tạo báo cáo từ tài liệu chung.
```

Hoặc ngắn hơn:

```text
InsightVault AI giúp nhóm không chỉ lưu tài liệu, mà còn hiểu và khai thác tri thức từ tài liệu bằng AI.
```

## 3. Vấn đề dự án giải quyết

Trong quá trình học tập, nghiên cứu hoặc làm project, một nhóm thường có rất nhiều tài liệu:

- Proposal.
- Requirement document.
- System design document.
- Meeting notes.
- Research papers.
- Draft reports.
- Final report.

Những tài liệu này thường gặp các vấn đề sau:

### 3.1. Tài liệu bị phân tán

File có thể nằm ở nhiều nơi:

- Google Drive.
- Máy cá nhân.
- Zalo/Messenger.
- GitHub.
- Nhiều thư mục khác nhau.

Điều này làm nhóm khó biết đâu là tài liệu mới nhất và khó nắm được toàn bộ context của project.

### 3.2. Khó tìm đúng thông tin

Tìm kiếm theo từ khóa chỉ giúp tìm nơi có từ khóa, nhưng không trả lời được câu hỏi thật sự của user.

Ví dụ user hỏi:

```text
MVP của project gồm những chức năng nào?
```

Nếu chỉ search từ khóa `MVP`, user vẫn phải tự đọc nhiều đoạn khác nhau để tổng hợp câu trả lời.

### 3.3. Khó đọc và tổng hợp nhiều tài liệu

Khi số lượng tài liệu tăng lên, việc đọc lại từng file rất mất thời gian.

Ví dụ, muốn viết báo cáo cuối kỳ, nhóm phải đọc lại proposal, requirement, meeting notes và report draft.

### 3.4. Khó phát hiện mâu thuẫn giữa tài liệu

Các tài liệu trong project có thể không nhất quán.

Ví dụ:

```text
Proposal nói MVP có chức năng AI-generated report.
Requirement document không đề cập chức năng này.
```

Nếu kiểm tra thủ công, nhóm rất dễ bỏ sót lỗi này.

### 3.5. Làm việc nhóm thiếu một kho tri thức chung

Nếu mỗi thành viên lưu tài liệu riêng, nhóm sẽ khó có một nguồn tri thức chung.

Người mới vào nhóm cũng khó hiểu project vì không biết nên đọc tài liệu nào trước.

## 4. Giải pháp của InsightVault AI

InsightVault AI giải quyết các vấn đề trên bằng cách tạo một **AI-powered shared knowledge workspace**.

Thay vì chỉ lưu file, hệ thống sẽ:

```text
Upload tài liệu
-> Xử lý nội dung tài liệu
-> Chia tài liệu thành chunks
-> Tạo embedding
-> Lưu vào vector database
-> Cho phép hỏi đáp, tóm tắt, so sánh và tạo báo cáo
```

Nói cách khác:

```text
Shared documents -> AI processing -> Knowledge base -> Ask / Compare / Detect gaps / Generate reports
```

Đây là cốt lõi của dự án.

## 5. Dự án khác gì Obsidian?

Đây là điểm team cần nắm rõ vì nếu không giải thích kỹ, dự án có thể bị hiểu nhầm là giống Obsidian.

### 5.1. Obsidian là gì?

Obsidian chủ yếu là công cụ ghi chú cá nhân.

Obsidian mạnh ở:

- Markdown notes.
- Linking giữa notes.
- Personal knowledge base.
- Tổ chức ghi chú cá nhân.

### 5.2. InsightVault AI khác gì?

InsightVault AI tập trung vào:

- Shared workspace cho nhóm project.
- Project documents như proposal, requirement, report, meeting notes, research papers.
- AI workflow có sẵn cho tài liệu.
- Hỏi đáp bằng RAG.
- So sánh tài liệu.
- Phát hiện gap/conflict.
- Tạo report.
- Phân quyền thành viên trong workspace.

So sánh ngắn:

| Obsidian | InsightVault AI |
|---|---|
| Chủ yếu là personal note-taking | Shared workspace cho nhóm project |
| Mạnh về liên kết note | Mạnh về phân tích tài liệu |
| Người dùng tự đọc và tổng hợp | AI hỗ trợ đọc hiểu, tóm tắt, so sánh |
| AI thường phụ thuộc plugin | AI workflow là tính năng cốt lõi |
| Collaboration không phải trọng tâm MVP | Co-work là một điểm khác biệt chính |

Kết luận:

```text
Obsidian giúp cá nhân ghi chú và liên kết note.
InsightVault AI giúp nhóm cùng quản lý và phân tích tài liệu project bằng AI.
```

## 6. Đối tượng người dùng

### 6.1. User

User là người dùng chính của hệ thống.

User có thể là:

- Sinh viên.
- Thành viên nhóm project.
- Researcher.
- Developer.
- Lecturer.

User có thể:

- Tạo workspace.
- Tham gia workspace.
- Upload tài liệu.
- Hỏi AI.
- Xem summary.
- So sánh tài liệu.
- Tạo report.

### 6.2. Admin

Admin là người quản trị hệ thống.

Admin có thể:

- Quản lý user.
- Theo dõi AI jobs.
- Xem job lỗi.
- Kiểm tra trạng thái hệ thống.

Admin không phải là người làm nội dung trong workspace mà chỉ giám sát hệ thống. System Admin không được xem hoặc truy cập nội dung workspace, folder, document, chunks, chat hoặc report, kể cả khi cùng tài khoản đó xuất hiện trong workspace membership.

## 7. Workspace là gì?

Workspace là không gian làm việc của một môn học, một project hoặc một chủ đề chung cho một nhóm người.

Ví dụ:

```text
Workspace: SWD391
Workspace: InsightVault AI Project
```

Trong workspace có thể có nhiều folder để phân loại tài liệu:

```text
HK1
FinalExam
Project Docs
Meeting Notes
Reports
```

Workspace giúp gom tài liệu theo cùng một ngữ cảnh và là boundary chính cho member/role/permission trong MVP.

Khi user hỏi AI trong workspace, hệ thống mặc định tìm thông tin trong toàn workspace. Nếu user muốn hỏi cố định vào một nguồn cụ thể, họ dùng mention:

- `@file`: giới hạn vào một document.
- `@folder`: giới hạn vào toàn bộ documents trong folder đó và các subfolder.

Folder không có member visibility riêng trong MVP; quyền truy cập vẫn theo workspace role.

## 8. Co-work là gì?

Co-work nghĩa là nhiều thành viên có thể cùng tham gia một workspace.

Một workspace có thể có nhiều thành viên, mỗi thành viên có một role khác nhau.

### 8.1. Các role trong workspace

| Role | Quyền chính |
|---|---|
| Owner | Quản lý workspace, thành viên, nội dung, report và trash |
| Editor | Upload tài liệu, tạo folder, hỏi AI, compare, tạo report và xóa tài liệu do chính mình upload |
| Viewer | Xem tài liệu/summary/report đã có và hỏi AI/RAG trong phạm vi được phép đọc |

### 8.2. Owner làm gì?

Owner có thể:

- Tạo workspace.
- Mời thành viên.
- Xem danh sách thành viên.
- Đổi role thành viên.
- Xóa thành viên khỏi workspace.
- Quản lý toàn bộ workspace.

### 8.3. Editor làm gì?

Editor có thể:

- Tạo folder.
- Upload document.
- Xóa, khôi phục hoặc xóa cứng document do chính Editor đó upload.
- Hỏi AI.
- So sánh tài liệu.
- Tạo report.

Editor không được invite/remove member.

### 8.4. Viewer làm gì?

Viewer có thể:

- Xem tài liệu.
- Xem summary.
- Xem report.
- Hỏi AI/RAG trong phạm vi workspace/folder/document được phép đọc.
- Không upload, compare, generate report, download file gốc, delete hoặc hard delete trong MVP.

### 8.5. Vì sao co-work quan trọng?

Nếu không có co-work, dự án sẽ giống personal knowledge base.

Khi thêm co-work, InsightVault AI trở thành:

```text
AI-powered shared knowledge workspace cho nhóm project
```

Đây là điểm giúp dự án khác Obsidian và Google Drive hơn.

## 9. Các tính năng chính của MVP

### 9.1. Đăng nhập bằng Google OAuth

User đăng nhập bằng Google.

Hệ thống không lưu mật khẩu.

Sau khi Google xác thực thành công:

```text
Backend nhận Google identity
-> Tạo hoặc cập nhật user
-> Phát hành JWT nội bộ
-> Frontend dùng JWT để gọi API
```

### 9.2. Quản lý workspace

User có thể:

- Tạo workspace.
- Xem workspace.
- Sửa tên/mô tả workspace.
- Xóa workspace.

Workspace là nơi chứa folder, document, chat và report.

### 9.3. Quản lý thành viên workspace

Owner có thể:

- Mời thành viên bằng email.
- Xem danh sách member.
- Đổi role member.
- Xóa member khỏi workspace.

Hệ thống dùng bảng `workspace_members` để lưu role của từng user trong workspace.

### 9.4. Quản lý folder

User có quyền phù hợp có thể:

- Tạo folder.
- Sửa folder.
- Xóa folder.
- Xem danh sách folder.

Folder dùng để phân loại tài liệu.

### 9.5. Upload tài liệu

User có thể upload tài liệu vào folder.

MVP hỗ trợ:

- PDF text-based.
- DOCX.
- TXT.
- Markdown.

File gốc lưu ở MinIO.

Metadata lưu trong PostgreSQL.

### 9.6. Xử lý tài liệu

Sau khi upload, hệ thống tạo AI job để xử lý tài liệu.

Pipeline:

```text
Đọc file từ MinIO
-> Extract text
-> Clean text
-> Chunk text
-> Generate embedding
-> Lưu chunk + embedding vào PostgreSQL + pgvector
-> Generate summary
-> Cập nhật document status
```

Trạng thái document:

```text
pending_upload
uploaded
processing
completed
failed
```

### 9.7. Tóm tắt tài liệu

AI tạo:

- Summary.
- Key points.
- Keywords.

Tính năng này giúp user đọc nhanh nội dung chính của tài liệu.

### 9.8. RAG Chat

User có thể hỏi AI dựa trên tài liệu trong workspace.

Phạm vi chat mới:

- Mặc định: toàn workspace.
- `@file`: một document cụ thể.
- `@folder`: một folder và toàn bộ subfolders.

Luồng RAG:

```text
User hỏi câu hỏi, có thể mention @file hoặc @folder
-> Backend kiểm tra quyền workspace
-> Backend resolve mentions thành document_ids nếu có
-> Hệ thống embedding câu hỏi
-> pgvector tìm chunks liên quan trong workspace hoặc document_ids đã resolve
-> Gửi context + câu hỏi sang Gemini API
-> Gemini trả lời
-> Lưu câu trả lời và sources
```

### 9.9. So sánh tài liệu

User có thể chọn hai hoặc nhiều tài liệu để AI so sánh.

AI có thể phân tích:

- Điểm giống nhau.
- Điểm khác nhau.
- Nội dung thiếu.
- Mâu thuẫn tiềm năng.
- Gợi ý điều chỉnh.

Ví dụ:

```text
Proposal có chức năng generate report.
Requirement chưa mô tả chức năng này.
```

### 9.10. Phát hiện gap/conflict

Gap là nội dung bị thiếu giữa các tài liệu.

Conflict là nội dung mâu thuẫn giữa các tài liệu.

Ví dụ:

```text
Meeting note nói bỏ tính năng export PDF.
Report draft vẫn ghi export PDF là MVP.
```

Hệ thống có thể cảnh báo và đề xuất cách xử lý.

### 9.11. Tạo report

User có thể tạo report từ:

- Một document.
- Một folder.
- Nhiều document.

Report lưu dạng Markdown.

Trong MVP chưa export PDF/DOCX.

### 9.12. Dashboard

Dashboard cho user:

- Số workspace.
- Số folder.
- Số document.
- Document đang processing.
- Document completed.
- Document failed.
- Report đã tạo.
- Job gần đây.
- Hoạt động gần đây trong workspace.

Dashboard cho admin:

- Tổng số user.
- Tổng số AI jobs.
- Job failed.
- Error logs.

## 10. AI trong dự án làm gì?

AI trong dự án có 5 nhiệm vụ chính:

### 10.1. Tóm tắt tài liệu

AI đọc nội dung tài liệu và tạo summary, key points, keywords.

### 10.2. Hỏi đáp tài liệu

AI trả lời câu hỏi dựa trên context được retrieve từ tài liệu đã upload.

### 10.3. So sánh tài liệu

AI so sánh hai hoặc nhiều tài liệu để tìm điểm giống, điểm khác và nội dung thiếu.

### 10.4. Phát hiện gap/conflict

AI phát hiện các điểm không nhất quán giữa các tài liệu.

### 10.5. Tạo report

AI tạo báo cáo Markdown từ tài liệu hoặc folder được chọn.

## 11. RAG là gì trong dự án này?

RAG là viết tắt của **Retrieval-Augmented Generation**.

Hiểu đơn giản:

```text
Trước khi AI trả lời, hệ thống tìm tài liệu liên quan trước.
```

Luồng RAG:

```text
User hỏi câu hỏi
-> Hệ thống biến câu hỏi thành vector
-> Tìm document chunks liên quan trong pgvector
-> Lấy các chunks đó làm context
-> Gửi context + câu hỏi sang Gemini
-> Gemini trả lời dựa trên context
```

Vì sao cần RAG?

Vì Gemini không tự biết tài liệu nội bộ của nhóm. RAG giúp Gemini trả lời dựa trên tài liệu đã upload.

## 12. Tech stack

Tech stack hiện tại:

| Thành phần | Công nghệ |
|---|---|
| Frontend | React Vite + Tailwind |
| Backend | ASP.NET Core Web API |
| Authentication | Google OAuth + JWT |
| File Storage | MinIO |
| Database | PostgreSQL |
| Vector Search | pgvector |
| AI Provider | Gemini API |
| AI Service | Python service |
| Background Job | .NET BackgroundService + ai_jobs + RabbitMQ queues |

### 12.1. Vai trò từng thành phần

**Frontend**

Nơi user thao tác với hệ thống.

**Backend**

Xử lý API, auth, permission, workspace, member, folder, document, report.

**MinIO**

Lưu file gốc.

**PostgreSQL**

Lưu dữ liệu hệ thống.

**pgvector**

Lưu embedding vector và phục vụ semantic search.

**Python AI Service**

Xử lý extract text, chunking, embedding, RAG, comparison, report generation.

**Gemini API**

Tạo embedding, summary, answer, comparison, report.

**Background job**

Current implementation uses `.NET BackgroundService + ai_jobs + RabbitMQ`
queues for long-running tasks such as document processing, report generation,
compare documents, and email delivery.

## 13. ERD hiện tại

Sau khi thêm co-work, ERD có các bảng chính:

```text
users
workspaces
workspace_members
folders
documents
document_chunks
ai_jobs
chat_sessions
chat_messages
reports
```

### 13.1. users

Lưu thông tin user đăng nhập Google.

### 13.2. workspaces

Lưu workspace.

Mỗi workspace có `owner_id` để biết owner chính.

### 13.3. workspace_members

Lưu thành viên trong workspace.

Gồm:

- workspace_id.
- user_id.
- role.
- status.
- invited_by.
- joined_at.

Bảng này giúp hỗ trợ co-work.

### 13.4. folders

Lưu folder trong workspace.

### 13.5. documents

Lưu metadata của tài liệu:

- File name.
- File type.
- MinIO object key.
- Status.
- Summary.
- Key points.
- Keywords.
- Uploaded by.

### 13.6. document_chunks

Lưu text chunks và embedding vector.

### 13.7. ai_jobs

Lưu job xử lý AI.

### 13.8. chat_sessions

Lưu phiên chat thuộc workspace. Chat session không còn cần cố định vào một folder/document; nguồn cụ thể được chọn theo từng message bằng `@file` hoặc `@folder`.

### 13.9. chat_messages

Lưu tin nhắn và sources.

### 13.10. reports

Lưu report do AI tạo.

Kết quả compare documents cũng có thể lưu trong bảng này với `report_type = comparison_report`.

## 14. Context Diagram

External entities của hệ thống:

```text
User
Admin
Google OAuth Provider
Gemini API
```

Không xem MinIO, PostgreSQL, pgvector là external entities vì chúng là hạ tầng nội bộ của hệ thống.

Luồng chính:

```text
User <-> InsightVault AI
Admin <-> InsightVault AI
InsightVault AI <-> Google OAuth
InsightVault AI <-> Gemini API
```

## 15. Use Case Diagram

User có các use case:

- Login with Google.
- Manage workspace.
- Invite member.
- Manage members.
- Manage folder.
- Upload document.
- View document status.
- Ask question.
- Summarize document.
- Compare documents.
- Detect gaps/conflicts.
- Generate report.
- View dashboard.

Admin có các use case:

- Manage users.
- Monitor AI jobs.
- Review error logs.

Google OAuth hỗ trợ login.

Gemini API hỗ trợ các chức năng AI.

## 16. MVP cần làm gì là đủ?

MVP nên ưu tiên:

1. Google OAuth login.
2. Shared workspace.
3. Workspace member roles.
4. Folder management.
5. Upload document vào MinIO.
6. Background document processing.
7. Chunking + embedding + pgvector.
8. Document summary.
9. RAG chat.
10. Compare documents.
11. Generate Markdown report.
12. Dashboard cơ bản.
13. Admin monitoring cơ bản.

## 17. Những gì chưa làm trong MVP

Không nên làm trong MVP:

- Realtime editing.
- Cursor presence.
- Chat realtime giữa thành viên.
- OCR.
- Mobile app.
- Export PDF/DOCX.
- Knowledge graph nâng cao.
- Version control phức tạp.

## 18. Luồng demo đề xuất

Khi demo, nên đi theo luồng này:

```text
1. User login bằng Google.
2. Tạo workspace "InsightVault AI Project".
3. Mời một thành viên vào workspace.
4. Tạo folder "Project Documents".
5. Upload proposal và requirement.
6. Hệ thống xử lý tài liệu.
7. Xem summary của từng tài liệu.
8. Hỏi AI: "MVP của project gồm những chức năng nào?"
9. Compare proposal với requirement.
10. AI phát hiện requirement thiếu phần generate report.
11. Generate report từ folder.
12. Admin xem job status hoặc dashboard.
```

Luồng này thể hiện đầy đủ giá trị:

- Có co-work.
- Có document management.
- Có AI.
- Có RAG.
- Có compare.
- Có report.
- Có admin/job monitoring.

## 19. Cốt lõi của dự án

Cốt lõi không phải là upload file.

Cốt lõi là:

```text
Shared documents
-> AI processing
-> Knowledge base
-> Ask / Compare / Detect gaps / Generate reports
```

Nếu teammate hiểu được chuỗi này thì sẽ hiểu dự án.

## 20. Kết luận cho team

InsightVault AI có 3 lớp giá trị:

### 20.1. Quản lý tài liệu nhóm

Workspace, folder, member roles.

### 20.2. Hiểu tài liệu bằng AI

Summary, RAG chat, semantic search.

### 20.3. Phân tích và tạo insight

Compare, gap detection, report generation.

Nếu chỉ làm lớp 1 thì giống Google Drive hoặc Obsidian.

Nếu chỉ làm lớp 2 thì giống chatbot RAG.

Nhưng kết hợp cả 3 lớp thì dự án có điểm riêng:

```text
AI-powered collaborative knowledge workspace cho nhóm project.
```
