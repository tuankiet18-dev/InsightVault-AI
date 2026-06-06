# InsightVault AI - Project Plan, MVP Scope, and Build Roadmap

## 1. Product Direction

### 1.1. One-line pitch

**InsightVault AI** là một collaborative AI-powered knowledge workspace giúp nhóm project cùng quản lý tài liệu, hỏi đáp bằng AI, so sánh tài liệu, phát hiện mâu thuẫn và tạo báo cáo từ kho tài liệu chung.

### 1.2. Product positioning

InsightVault AI không chỉ là nơi lưu file.

Sản phẩm tập trung vào 3 lớp giá trị:

1. **Shared document workspace**: nhóm cùng tạo workspace, mời thành viên, phân quyền và quản lý tài liệu.
2. **AI document understanding**: AI tóm tắt tài liệu, hỏi đáp theo tài liệu bằng RAG, tìm kiếm ngữ nghĩa.
3. **Insight generation**: AI so sánh tài liệu, phát hiện gap/conflict và tạo Markdown report.

### 1.3. Difference from similar tools

| Tool | Trọng tâm | InsightVault AI khác biệt |
|---|---|---|
| Google Drive | Lưu trữ file | Có AI phân tích, so sánh, tạo report |
| Notion | Note/database workspace | Tập trung vào project documents và RAG |
| Obsidian | Personal knowledge base | Có shared workspace, role-based co-work, AI workflow |
| ChatGPT upload file | Chat với file riêng lẻ | Có workspace, folder, vector database, report history, team context |

### 1.4. Target users

- Sinh viên làm đồ án.
- Nhóm project môn học.
- Nhóm nghiên cứu.
- Developer team.
- Giảng viên hoặc mentor theo dõi tài liệu project.

### 1.5. Core user pain points

- Tài liệu project bị phân tán.
- Thành viên mới khó nắm context.
- Tìm kiếm keyword không trả lời được câu hỏi thực tế.
- Proposal, requirement, meeting note và report dễ không khớp nhau.
- Viết báo cáo mất thời gian vì phải đọc lại nhiều tài liệu.
- Nhóm khó có một knowledge base chung.

---

## 2. MVP Definition

### 2.1. MVP goal

MVP cần chứng minh được luồng giá trị chính:

```text
Shared workspace
-> Upload project documents
-> AI processes documents
-> Team asks, compares, detects gaps, and generates reports
```

Nếu demo được luồng này end-to-end, MVP được xem là thành công.

### 2.2. MVP must-have features

#### Authentication

- Login bằng Google OAuth.
- Backend phát hành JWT nội bộ.
- Role hệ thống:
  - `user`
  - `admin`

#### Shared workspace

- Tạo workspace.
- Sửa/xóa workspace.
- Mời thành viên vào workspace.
- Xem danh sách thành viên.
- Đổi role thành viên.
- Xóa thành viên.

Workspace roles:

- `owner`
- `editor`
- `viewer`

Viewer được hỏi AI trong phạm vi workspace/folder/document mà họ có quyền đọc, nhưng không được upload, xóa, chỉnh sửa nội dung hoặc quản lý member.

#### Folder management

- Tạo folder trong workspace.
- Sửa/xóa folder.
- Xem danh sách folder.

#### Document management

- Upload document vào folder.
- Hỗ trợ:
  - PDF text-based
  - DOCX
  - TXT
  - Markdown
- Lưu file gốc vào MinIO.
- Lưu metadata vào PostgreSQL.
- Hiển thị document status:
  - `pending_upload`
  - `uploaded`
  - `processing`
  - `completed`
  - `failed`

#### Background processing

- Tạo AI job sau khi upload.
- Worker xử lý document bất đồng bộ.
- Mặc định dùng `.NET BackgroundService + ai_jobs`; RabbitMQ là optional nếu còn thời gian.
- Lưu retry count và error message.

#### AI document processing

- Extract text.
- Clean text.
- Chunk text.
- Generate embedding bằng Gemini Embedding API.
- Lưu embedding vào PostgreSQL + pgvector.
- Generate summary, key points, keywords.

#### RAG chat

- Chat session thuộc một workspace.
- Không có mention: retrieve chunks trên toàn workspace.
- Có `@file`: backend resolve sang document id cụ thể.
- Có `@folder`: backend resolve folder và subfolders sang danh sách document ids.
- Retrieve chunks theo đúng quyền workspace và explicit document ids khi có mention.
- Gemini trả lời dựa trên context.
- Lưu chat history.
- Lưu sources/citations trong `sources_json` hoặc bảng citation riêng.

#### Document comparison

- Chọn 2 hoặc nhiều document.
- AI so sánh:
  - mục tiêu
  - phạm vi
  - điểm giống
  - điểm khác
  - missing information
  - potential conflicts
  - recommendation

#### Report generation

- Generate Markdown report.
- Report có thể là:
  - summary report
  - comparison report
  - gap analysis report
  - section report
- Lưu report trong database.

#### Dashboard

User dashboard:

- Số workspace.
- Số folder.
- Số document.
- Số document completed/processing/failed.
- Số report.
- Recent jobs.

Admin dashboard:

- User list.
- AI job list.
- Failed jobs.
- Error logs cơ bản. Admin dashboard chỉ hiển thị aggregate/job/user metadata, không hiển thị nội dung workspace/document/report của user.

---

## 3. MVP Non-goals

Những phần không làm trong MVP:

- Realtime collaborative editing.
- Cursor presence.
- Chat realtime giữa thành viên.
- OCR cho file scan.
- Mobile app.
- Export PDF/DOCX.
- Knowledge graph nâng cao.
- Version control phức tạp.
- Billing/payment.
- Fine-tuning model.
- Obsidian plugin.

Các phần này có thể đưa vào future scope nếu còn thời gian hoặc sau khi MVP ổn định.

---

## 4. Suggested Architecture

### 4.1. Tech stack

| Layer | Technology |
|---|---|
| Frontend | React Vite + Tailwind |
| Backend | ASP.NET Core Web API |
| Auth | Google OAuth + JWT |
| Database | PostgreSQL |
| Vector Search | pgvector |
| File Storage | MinIO |
| AI Provider | Gemini API |
| AI Service | Python service |
| Background Job | .NET BackgroundService + ai_jobs; RabbitMQ optional |

### 4.2. High-level flow

```text
User uploads document
-> ASP.NET Backend stores file in MinIO
-> Backend stores metadata in PostgreSQL
-> Backend creates AI job
-> Worker/Python AI Service processes document
-> Gemini creates embeddings and AI outputs
-> PostgreSQL + pgvector stores chunks and vectors
-> User can chat, compare, and generate reports
```

### 4.3. Main database tables

Core ERD tables:

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

### 4.4. External entities

Context diagram external entities:

- User
- Admin
- Google OAuth Provider
- Gemini API

MinIO, PostgreSQL, pgvector, backend, frontend, worker và AI service là internal components/infrastructure.

---

## 5. Build Roadmap

### Sprint 0 - Setup Foundation

**Goal:** toàn bộ team chạy được project local.

Deliverables:

- React Vite app.
- ASP.NET Core Web API solution.
- Python AI service skeleton.
- Docker Compose cho PostgreSQL, MinIO, RabbitMQ nếu dùng.
- EF Core setup.
- Initial migration.
- Health check APIs.

### Sprint 1 - Auth and Workspace

**Goal:** user đăng nhập được và tạo shared workspace được.

Deliverables:

- Google OAuth login.
- JWT auth.
- User table.
- Workspace CRUD.
- Workspace member table.
- Invite/manage member basic flow.
- FE auth flow.
- FE workspace pages.

### Sprint 2 - Folder and Document Upload

**Goal:** user upload tài liệu vào shared workspace được.

Deliverables:

- Folder CRUD.
- Document upload API.
- MinIO integration.
- Document metadata.
- File type validation.
- Document status UI.
- Create `process_document` job after upload.

### Sprint 3 - Document Processing and Embedding

**Goal:** tài liệu upload xong được xử lý thành knowledge base.

Deliverables:

- Worker xử lý AI jobs.
- Extract text từ PDF/DOCX/TXT/Markdown.
- Chunk text.
- Gemini embedding.
- pgvector storage.
- Document status completed/failed.
- Error handling.

### Sprint 4 - Summary and RAG Chat

**Goal:** user hỏi đáp với tài liệu được.

Deliverables:

- Generate document summary.
- Save key points and keywords.
- Chat session API.
- Chat message API.
- RAG retrieval workspace-wide by default, with `@file` and `@folder` mentions resolved to explicit document ids.
- Gemini answer generation.
- Source/citation display.
- FE chat page.

### Sprint 5 - Compare and Reports

**Goal:** user so sánh tài liệu và tạo report được.

Deliverables:

- Compare documents API.
- Gemini compare prompt.
- Gap/conflict detection.
- Generate Markdown report.
- Save report.
- Report list/detail UI.
- Compare UI.

### Sprint 6 - Dashboard and Admin

**Goal:** user/admin theo dõi trạng thái hệ thống được.

Deliverables:

- User dashboard.
- Admin dashboard.
- Job list.
- Failed job view.
- Retry failed job.
- Basic usage/status stats.

### Sprint 7 - Testing and Demo Polish

**Goal:** MVP demo mượt end-to-end.

Deliverables:

- Fix permission bugs.
- Integration test critical APIs.
- Prepare demo data.
- Prepare fallback if Gemini API fails.
- UI polish.
- Final presentation script and demo flow.

---

## 6. Team Task Split

Team có 6 người:

- 3 Backend .NET members, có thể làm AI.
- 3 Frontend members vibe code FE.

### BE1 - Backend Lead

Main ownership:

- ASP.NET project structure.
- Google OAuth.
- JWT.
- User/admin role.
- Workspace APIs.
- Workspace member APIs.
- Permission service.

Key deliverables:

- Auth working.
- Shared workspace working.
- Role-based permission working.

### BE2 - Backend Infrastructure

Main ownership:

- Docker Compose.
- PostgreSQL.
- MinIO.
- .NET BackgroundService + ai_jobs setup; RabbitMQ optional.
- Document upload.
- AI jobs.
- Worker.
- Retry/error handling.

Key deliverables:

- Upload file to MinIO.
- AI job created and processed.
- Worker stable.

### BE3 - AI Engineer

Main ownership:

- Python AI service.
- Gemini API integration.
- Text extraction.
- Chunking.
- Embedding.
- pgvector search.
- Summary.
- RAG.
- Compare.
- Report generation.

Key deliverables:

- Document processing pipeline.
- RAG answer.
- Compare/report pipeline.

### FE1 - Frontend Lead

Main ownership:

- React Vite setup.
- Tailwind setup.
- App shell.
- Auth UI.
- Reusable components.
- Responsive polish.

Key deliverables:

- Login flow.
- Layout.
- Component system.

### FE2 - Workspace and Document UI

Main ownership:

- Workspace pages.
- Member management UI.
- Folder pages.
- Document upload.
- Document list/detail.
- Summary display.

Key deliverables:

- Workspace/folder/document flow complete.
- Co-work UI complete.

### FE3 - AI and Dashboard UI

Main ownership:

- Chat UI.
- Compare UI.
- Report UI.
- Dashboard.
- Admin pages.

Key deliverables:

- AI features usable from UI.
- Dashboard/admin monitoring usable.

---

## 7. Build Priority

Nếu bị trễ, ưu tiên giữ các phần sau:

1. Google OAuth.
2. Shared workspace + member roles.
3. Folder/document upload.
4. MinIO + PostgreSQL.
5. Background processing.
6. Embedding + pgvector.
7. RAG chat.
8. Compare documents.
9. Generate Markdown report.

Có thể giảm scope:

- Admin dashboard chỉ làm job/user list đơn giản.
- Compare chỉ hỗ trợ 2 documents trước.
- Report chỉ lưu Markdown, chưa cần editor đẹp.
- RabbitMQ có thể thay bằng `.NET BackgroundService`.
- Viewer permission không được đơn giản hóa: viewer được đọc và hỏi AI/RAG, nhưng không upload, compare, generate report, download file gốc hoặc delete.

---

## 8. If There Is Extra Time

Nếu MVP hoàn thành sớm, ưu tiên phát triển thêm theo thứ tự:

### 8.1. Better collaboration

- Workspace activity log.
- Comment trên report.
- Mention member trong report/comment.
- Notification khi document xử lý xong.

### 8.2. Better AI quality

- Reranking retrieved chunks.
- Better prompt templates.
- Answer confidence score.
- More detailed citations.
- Report reviewer step.

### 8.3. Better document experience

- Preview document.
- Highlight source chunks.
- Document tags.
- Related documents.

### 8.4. Better admin/observability

- AI usage statistics.
- Token usage tracking.
- Job duration tracking.
- Error analytics.

### 8.5. Future advanced features

- Export PDF/DOCX.
- OCR for scanned documents.
- Knowledge graph.
- Obsidian integration.
- Multi-agent report generation.
- Mobile app.

---

## 9. Demo Flow

Recommended final demo:

```text
1. Login with Google.
2. Create workspace "InsightVault AI Project".
3. Invite another member.
4. Create folder "Project Documents".
5. Upload proposal and requirement.
6. Worker processes documents.
7. View summaries.
8. Ask AI: "MVP của project gồm những chức năng nào?"
9. Compare proposal and requirement.
10. AI detects missing report generation requirement.
11. Generate Markdown report.
12. Admin checks job status/dashboard.
```

This demo proves:

- Co-work.
- Document management.
- AI processing.
- RAG.
- Comparison.
- Gap detection.
- Report generation.
- Admin monitoring.

---

## 10. Definition of Done

MVP được xem là hoàn thành khi:

- User login bằng Google được.
- User tạo shared workspace được.
- Owner mời member được.
- Member role được kiểm tra trong API.
- User upload document được.
- Document được xử lý thành chunks và embeddings.
- User xem summary được.
- User chat trong workspace được, và dùng `@file` / `@folder` để giới hạn nguồn.
- Owner/Editor compare documents được.
- Owner/Editor generate Markdown report được.
- Dashboard hiển thị trạng thái cơ bản.
- Admin xem user/job/failed jobs được, nhưng không truy cập nội dung workspace của user.
- Demo end-to-end chạy được ổn định.
