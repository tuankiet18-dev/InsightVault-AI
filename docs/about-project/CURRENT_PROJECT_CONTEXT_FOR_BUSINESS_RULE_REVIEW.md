# InsightVault AI - Current Context For Business Rule Review

File này dùng để mở một session chat mới và bàn lại business rule. Nội dung bên dưới tóm tắt hiện trạng dự án, phần đã làm, phần chưa làm, và các giả định business rule cũ đang nằm trong code/docs.

Update 2026-06-15: this file is historical context from earlier business-rule
review sessions. Use `docs/about-project/CURRENT_PROJECT_STATUS.md` for the
current implementation status. Several items below are now done, including
AiJobs, Reports, Admin, Dashboard, Billing, PayOS, and SMTP/RabbitMQ email
queueing. Backend Chat/RAG APIs remain pending.

Ngày ghi nhận: 2026-06-03.

Branch đang ghi nhận: `feat/document-ai-boundary`.

Lưu ý: branch này đã push lên remote và có thay đổi mới nhất về BE/AI boundary cho document processing. Nếu PR chưa merge vào `main`, `main` có thể vẫn còn khác ở phần AI update document.

## 1. Mục tiêu sản phẩm hiện tại

InsightVault AI là nền tảng quản lý tài liệu theo workspace, có AI hỗ trợ:

- Upload và quản lý tài liệu trong workspace/folder.
- Xử lý tài liệu bằng AI: extract text, chunk, embedding, summary, key points, keywords.
- RAG chat dựa trên tài liệu đã upload.
- So sánh tài liệu, phát hiện gap/conflict.
- Generate Markdown report.
- Theo dõi AI jobs/admin monitoring cơ bản.

MVP tối thiểu cũ:

- Có login.
- Có workspace/folder/document upload.
- Có AI thật qua LLM API key.
- Có pgvector/RAG.
- Deploy được.

## 2. Kiến trúc hiện tại

Các service chính:

- Frontend: React/Vite.
- Backend: ASP.NET Core Web API, EF Core, PostgreSQL.
- AI service: Python FastAPI.
- Database: PostgreSQL + pgvector.
- Object storage: MinIO.
- Queue: RabbitMQ.

Luồng Backend/AI mục tiêu:

```text
Frontend
  -> Backend
    -> auth/permission/business rule
    -> database business state
    -> internal call/queue to AI service
      -> extract/chunk/embed/retrieve/Gemini
      -> return structured result
    -> Backend persists final state
```

Frontend không gọi AI service trực tiếp.

## 3. Phần đã implement thật trong Backend

Controller hiện có:

- `AuthController`
- `WorkspacesController`
- `FoldersController`
- `DocumentsController`
- `AiJobsController`
- `ReportsController`
- `DashboardController`
- `AdminController`
- `BillingController`
- `HealthController`
- `MetaController`

Controller chưa có dù contract/schema đã chuẩn bị:

- `ChatController`

Backend đã có:

- Google auth/JWT structure.
- Current user service.
- Workspace CRUD.
- Workspace member invite/list/update/remove.
- Folder CRUD.
- Document presigned upload flow.
- Confirm upload.
- Document retry processing.
- Soft delete document.
- RabbitMQ publisher.
- `DocumentProcessingWorker`.
- `IAiServiceClient.ProcessDocumentAsync`.
- AI job listing/detail/retry.
- Compare/report async APIs and workers.
- Dashboard/admin metadata APIs.
- Workspace billing, PayOS checkout/webhook, credit ledger, and credit guards.
- SMTP email queueing through RabbitMQ when enabled.
- Repository pattern: generic repository + specific repositories.
- EF Core entities/migrations cho users, workspaces, folders, documents, document_chunks, ai_jobs, chat_sessions, chat_messages, chat_message_sources, reports.

Backend chưa có:

- Backend API cho RAG chat.
- Backend `QueryRagAsync`.
- Frontend billing UI now exists; backend review still owns the billing rules,
  credit ledger, and PayOS webhook correctness.

## 4. Phần đã implement trong AI service

AI service endpoint hiện có:

- `POST /process-document`
- `POST /rag/query`
- `POST /compare`
- `POST /generate-report`

AI service hiện làm được:

- Đọc file từ MinIO.
- Extract text cho PDF text-based, DOCX, TXT, Markdown.
- Chunk text.
- Gọi Gemini embedding.
- Ghi `document_chunks` vào pgvector.
- Generate summary/key points/keywords.
- RAG query: embed question, similarity search, build prompt, gọi Gemini, trả answer + sources.
- Compare documents.
- Generate Markdown report.

Config quan trọng:

- `AI_ALLOW_REPORT_PERSISTENCE=false` mặc định.
- Khi `false`, AI không persist report; Backend nên nhận response và tự quyết định lưu report.

## 5. Luồng upload/document processing hiện tại

Flow hiện tại:

```text
FE -> BE: request presigned upload
BE: check permission owner/editor
BE: create document status pending_upload
BE -> FE: uploadUrl + documentId
FE -> MinIO: PUT file
FE -> BE: confirm upload
BE: validate status/size/content type
BE: mark document uploaded
BE: create ai_job queued
BE: publish RabbitMQ message { jobId }
BE worker: consume queue document-processing
BE worker: mark document/job processing
BE worker -> AI: POST /process-document
AI: read MinIO, extract, chunk, embed, write document_chunks, summarize
AI -> BE: return summary/key_points/keywords/chunk_count
BE worker: mark document/job completed or failed
```

E2E đã test pass với Docker:

- `documents.status = Completed`
- `ai_jobs.status = Completed`
- `document_chunks` có row
- summary có dữ liệu

## 6. BE/AI boundary mới nhất

Đã chốt và đã sửa trên branch `feat/document-ai-boundary`:

- AI service không update bảng `documents` nữa.
- AI service vẫn được ghi `document_chunks`.
- Backend là bên update:
  - `documents.status`
  - `documents.summary`
  - `documents.key_points`
  - `documents.keywords`
  - `documents.processing_error`
  - `documents.processed_at`
  - `ai_jobs.status`
  - `ai_jobs.output_payload/error_message`

Vẫn còn compromise:

- AI service vẫn có DB connection để đọc `documents`, đọc/ghi `document_chunks`, phục vụ RAG/report/compare.
- Nếu cần hardening sau này, có thể tạo restricted DB user cho AI chỉ được thao tác phần vector/chunks cần thiết.

## 6.1. Business rule mới đã chốt

Sau review ngày 2026-06-03, rule mới cho Workspace/Folder/Chat/RAG là:

- Workspace là một môn học, một project hoặc một knowledge base chung cho một nhóm người.
- Folder chỉ dùng để phân loại tài liệu trong workspace, ví dụ `HK1`, `FinalExam`, `Project Docs`, `Meeting Notes`.
- Permission MVP vẫn theo workspace role `Owner` / `Editor` / `Viewer`; chưa làm member visibility riêng theo folder/document.
- Một workspace có thể có nhiều chat session.
- Chat session thuộc workspace và mặc định hỏi trên toàn workspace.
- User giới hạn nguồn theo từng message bằng mention:
  - `@file`: trỏ tới một document cụ thể.
  - `@folder`: trỏ tới một folder; backend resolve folder đó và subfolders thành explicit `document_ids`.
- Backend kiểm tra workspace permission và resolve mentions trước khi gọi AI.
- AI service nhận `workspace_id` hoặc explicit `document_ids`; AI không tự quyết định permission.

## 6.2. Business rule chốt thêm ngày 2026-06-04

### Role và privacy

- Workspace role giữ 3 role: `Owner`, `Editor`, `Viewer`.
- System `Admin` không được xem/truy cập dữ liệu workspace, folder, document, chunks, chat hoặc report của user. Admin chỉ dùng cho quản lý user/system/job monitoring.
- `Viewer` được xem workspace/folder/document metadata, xem summary/report đã có và hỏi AI/RAG.
- `Viewer` không upload, compare document, generate report, delete/hard delete hoặc download file gốc trong MVP.
- `Editor` được tạo folder, upload document, hỏi AI/RAG, compare document và generate report.
- `Editor` không được invite/remove member.
- `Owner` quản lý workspace/member/content/trash/report delete.
- Owner transfer chưa cần làm gấp trong MVP, có thể để phase sau.
- Member `Invited` có thể thấy workspace/invitation tồn tại, nhưng không thấy folder, document, chunks, chat hoặc report cho tới khi active.

### Folder/document/delete/trash

- Permission vẫn chỉ theo workspace role, không có permission riêng theo folder/document trong MVP.
- `@folder` mặc định include subfolders; nếu sau này UI có toggle tắt thì backend tôn trọng `includeSubfolders=false`.
- Soft delete folder cha sẽ soft delete toàn bộ folder con và documents trong cây folder đó.
- Không cho duplicate active file name trong cùng một folder.
- Soft delete document đưa document vào Trash và set `DeletedAt`; MinIO object chưa bị xóa ngay.
- Soft-deleted document/folder phải bị loại khỏi list thường, mention resolution, compare/report source resolution và RAG retrieval.
- Chunks của soft-deleted document không cần xóa vật lý ngay, nhưng phải bị ẩn qua filter `documents.deleted_at IS NULL`.
- Hard delete chỉ thực hiện từ Trash; khi hard delete thì xóa metadata, chunks và MinIO object.
- Owner được soft delete, restore và hard delete mọi document trong workspace.
- Editor chỉ được soft delete, restore và hard delete document do chính Editor đó upload.
- Viewer không được delete, restore hoặc hard delete document, kể cả document trước đây do Viewer đó upload.
- Trash UI/API cần có cho document.

### Chat/RAG

- Chat session là private theo từng user, không shared toàn workspace.
- Chỉ document `Completed` mới được dùng để hỏi AI/RAG.
- RAG chat không tạo `AiJob` để tránh sinh quá nhiều job nhỏ.
- Web search chưa nằm trong MVP; contract có thể giữ placeholder nhưng UI nên disable.

### Compare/report

- Compare là user-triggered, không tự chạy sau upload trong MVP.
- Compare/report nên chạy async qua `ai_jobs` vì gọi LLM có thể lâu và tránh giữ request HTTP quá dài.
- Report dùng versioning: regenerate cùng một report sẽ tạo version mới để dễ kiểm chứng.
- Report có thể tạo theo folder; backend resolve folder/subfolders thành explicit `document_ids` trước khi gọi AI.
- Owner và Editor được tạo report.
- Chỉ Owner được delete report.
- Backend là bên persist report và report version; AI service không tự ghi `reports`.

### AI service DB access

- MVP vẫn cho AI service đọc `documents` và đọc/ghi `document_chunks`.
- AI cần đọc `documents` để join lấy file name, kiểm tra `deleted_at`, status/source metadata và phục vụ RAG/compare/report.
- AI service vẫn được ghi `document_chunks` trong MVP.
- Chưa cần restricted DB user ngay; để hardening sau.

## 7. Business rules cũ đang được giả định

### 7.1 User/Auth

- User login bằng Google OAuth.
- Backend sinh JWT nội bộ.
- Business API cần JWT.
- Public API gồm health/meta/auth google.
- `SystemRole` gồm:
  - `User`
  - `Admin`

Giả định cũ:

- `Admin` là admin hệ thống.
- `Owner` là người quản lý workspace, không phải admin hệ thống.

### 7.2 Workspace

Entity chính:

- `Workspace`
- `WorkspaceMember`

Workspace fields chính:

- `OwnerId`
- `Name`
- `Description`
- `IsArchived`
- `DeletedAt`

Business rules cũ:

- User tạo workspace sẽ trở thành `Owner`.
- Workspace có soft delete bằng `DeletedAt`.
- Workspace có thể archive bằng `IsArchived`.
- Chỉ member active mới được xem workspace.
- Chỉ owner được manage workspace/member.

### 7.3 Workspace member/role

Role cũ:

- `Owner`
- `Editor`
- `Viewer`

Member status cũ:

- `Invited`
- `Active`
- `Removed`

Business rules cũ:

- Owner có toàn quyền trong workspace.
- Editor có quyền mutate content như folder/document.
- Viewer chỉ có quyền xem.
- Removed member có `RemovedAt`.
- Unique member theo email/user chỉ áp dụng với member chưa removed, nhờ filtered unique index.
- Removed member có thể invite lại sau.

Trạng thái sau chốt 2026-06-04:

- Viewer được hỏi AI/RAG, nhưng không compare/generate report/download file gốc/delete trong MVP.
- Editor không được invite/remove member; chỉ Owner quản lý member.
- Owner transfer chưa cần làm gấp trong MVP; để phase sau.
- Invited member chỉ thấy workspace/invitation shell, không thấy nội dung cho tới khi active.

### 7.4 Folder

Folder fields chính:

- `WorkspaceId`
- `ParentFolderId`
- `Name`
- `Description`
- `CreatedById`
- `DeletedAt`

Business rules cũ:

- Folder nằm trong workspace.
- Folder hỗ trợ nhiều cấp thông qua `ParentFolderId`.
- List folder theo `parentFolderId`.
- Folder name unique trong cùng workspace + cùng parent, chỉ tính folder chưa deleted.
- Có thể tạo lại folder trùng tên sau khi folder cũ đã soft delete.
- Xóa folder là soft delete.
- Xóa folder cha sẽ soft delete cả cây folder con.
- Move folder không được move vào chính nó hoặc descendant của nó.

Trạng thái sau chốt 2026-06-04:

- Xóa folder cha sẽ soft delete folder con và documents trong cây folder đó.
- Move folder chỉ đổi parent của folder; documents/chunks trong folder đó không cần đổi vì `document.folder_id` vẫn trỏ tới folder gốc.
- Folder không có permission riêng; chỉ dùng workspace role.

### 7.5 Document upload

Supported file types cũ:

- `.pdf` -> `application/pdf`
- `.docx` -> `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- `.txt` -> `text/plain`
- `.md` -> `text/markdown`

Business rules cũ:

- Max file size: 25 MB.
- Backend tạo MinIO object key, FE không được chọn key/bucket.
- Object key format:

```text
workspaces/{workspaceId}/documents/{documentId}/original{extension}
```

- File name được normalize bằng `Path.GetFileName`.
- Content type phải match extension.
- Presign tạo document status `PendingUpload`.
- Confirm upload chỉ hợp lệ khi document đang `PendingUpload`.
- Confirm upload validate size/content type khớp request ban đầu.
- Confirm xong document thành `Uploaded`, tạo `AiJob(ProcessDocument, Queued)` và publish RabbitMQ.
- Retry processing không cho document `PendingUpload`; các status khác có thể retry.
- Delete document là soft delete metadata + cố gắng xóa object MinIO.

Status cũ:

- `PendingUpload`
- `Uploaded`
- `Processing`
- `Completed`
- `Failed`

Trạng thái sau chốt 2026-06-04:

- Reject duplicate active file name trong cùng folder.
- Soft delete document hide chunks khỏi retrieval; hard delete mới xóa chunks vật lý.
- Viewer không được download file gốc trong MVP; preview/download API để phase sau nếu cần.
- Virus scan là future hardening; MVP giữ size/content type/extension.

### 7.6 AI jobs

AiJob types cũ:

- `ProcessDocument`
- `GenerateSummary`
- `RagChat`
- `GenerateReport`
- `CompareDocuments`

AiJob status cũ:

- `Queued`
- `Processing`
- `Completed`
- `Failed`
- `Cancelled`

Business rules cũ:

- `ai_jobs` lưu trạng thái tác vụ AI để FE/admin poll/monitor.
- RabbitMQ chỉ là delivery mechanism để wake worker.
- `ai_jobs` là source of truth về trạng thái job.
- Hiện mới có flow thật cho `ProcessDocument`.

Trạng thái sau chốt 2026-06-04:

- RAG chat không tạo `AiJob`.
- Compare/report chạy async qua `ai_jobs`.
- Cancel job chưa cần trong MVP dù enum có `Cancelled`.

### 7.7 Chat/RAG

Schema/DTO đã có:

- `ChatSession`
- `ChatMessage`
- `ChatMessageSource`
- Chat DTOs

Backend API chưa có.

AI endpoint đã có:

- `POST /rag/query`

Chat/RAG rule mới:

- Chat session thuộc một workspace.
- Chat session mặc định workspace-wide, không còn bắt buộc cố định vào folder/document.
- User dùng `@file` để hỏi theo một document cụ thể.
- User dùng `@folder` để hỏi theo toàn bộ documents trong folder đó và subfolders.
- Backend resolve `@file` / `@folder` thành explicit `document_ids` trước khi gọi AI.
- AI service chỉ xử lý workspace/document IDs Backend gửi, không tự quyết định permission.
- Chat message roles:
  - `User`
  - `Assistant`
  - `System` trong Domain
  - API contract chủ yếu mới dùng `user` và `assistant`.
- AI trả sources gồm `chunk_id`, `document_id`, `file_name`, `snippet`, `similarity`.
- Backend sẽ lưu user message, assistant message, sources.

Trạng thái sau chốt 2026-06-04:

- Chat session private theo user.
- Viewer được tạo private chat session và hỏi AI/RAG.
- Document chưa `Completed` không được dùng cho RAG.
- `@folder` có include subfolders mặc định true không? Rule mới: có, trừ khi UI cho user tắt rõ ràng.
- Web search chưa implement trong MVP; giữ placeholder và disable UI.

### 7.8 Reports/Compare

Schema/DTO đã có:

- `Report`
- Report DTOs
- `CompareDocumentsRequest/Response`
- `GenerateReportRequest`

Backend API chưa có.

AI endpoint đã có:

- `POST /compare`
- `POST /generate-report`

Report types cũ:

- `SummaryReport`
- `ComparisonReport`
- `GapAnalysisReport`
- `GapConflictReport`
- `FolderReport`
- `SectionReport`
- `CustomReport`

Business rules cũ:

- Backend quyết định source documents và permission.
- AI tạo markdown/structured result.
- Backend nên persist report nếu user yêu cầu.
- `AI_ALLOW_REPORT_PERSISTENCE=false` mặc định nên AI không tự ghi reports.

Trạng thái sau chốt 2026-06-04:

- Report có versioning; regenerate tạo version mới.
- Compare là user-triggered, không tự chạy sau upload.
- Report có thể tạo theo folder; backend resolve folder/subfolders thành document IDs.
- Owner/Editor được tạo report; chỉ Owner được delete report.

### 7.9 Soft delete/trash

Business rules cũ:

- Nhiều bảng có `DeletedAt`/`RemovedAt`.
- Folder/document/workspace/report dùng soft delete.
- Unique index với folder/member đã xử lý active-only để cho phép tạo/invite lại sau khi soft delete/remove.

Trạng thái sau chốt 2026-06-04:

- Cần Trash UI/API cho document.
- Owner được hard delete mọi document trong Trash của workspace; Editor chỉ được hard delete document do chính mình upload.
- Retention period chưa chốt; không blocker MVP, có thể hard delete thủ công trước.
- Hard delete document sẽ xóa metadata, chunks và MinIO object.

## 8. Database/schema hiện tại ở mức khái niệm

Bảng chính:

- `users`
- `workspaces`
- `workspace_members`
- `folders`
- `documents`
- `document_chunks`
- `ai_jobs`
- `chat_sessions`
- `chat_messages`
- `chat_message_sources`
- `reports`

Vector:

- `document_chunks.embedding` dùng pgvector, dimension theo Gemini embedding đã chốt là 768.
- AI service dùng similarity search trên `document_chunks`.

Một số index/rule đáng chú ý:

- Folder unique active-only theo workspace/parent/name.
- Workspace member unique active-only theo workspace/email và workspace/user.
- `document_chunks` có unique/document chunk index và vector index.

## 9. Team ownership cũ

Theo plan cũ:

- An: Frontend layout/auth/dashboard/workspace screens.
- Nguyên: Frontend folder/document/upload/status UI.
- Phú: Frontend AI chat/compare/report/mobile polish.
- Anh: Backend document upload, MinIO, AI jobs, summary/report/compare orchestration, admin monitoring.
- Kiệt: AI/RAG core, chunking, embedding, pgvector, chat answer with sources.
- Thịnh: Backend auth, user, workspace, member, role/permission; Week 6 cũng ghi Thịnh phụ trách `chat_sessions`, `chat_messages API`.

Ranh giới cũ:

- Anh không làm retrieval/prompt/chunking/embedding.
- Kiệt không làm permission, upload, MinIO key, job status API, report persistence.
- ChatService/ChatController cần phối hợp với Thịnh vì plan ghi Thịnh phụ trách chat session/message API.

## 10. Các điểm có khả năng phải sửa khi đổi business rule

Nếu rule mới đổi, các vùng code/docs có khả năng bị ảnh hưởng:

- Role/permission:
  - `Application/Services/Auth/WorkspacePermissionService.cs`
  - `Application/Services/Workspaces/WorkspacePermissionService.cs`
  - `WorkspacesController`
  - `FolderService`
  - `DocumentService`

- Folder behavior:
  - `FolderService`
  - `FolderRepository`
  - migration/index nếu đổi uniqueness/cascade rule

- Document upload/status:
  - `DocumentService`
  - `DocumentProcessingWorker`
  - `AiServiceClient`
  - `ai-service/api/process.py`

- RAG/chat:
  - cần thêm hoặc sửa `IAiServiceClient`
  - cần implement `ChatService/ChatController`
  - cần implement rule mới: session thuộc workspace, source mentions theo từng message

- Report/compare:
  - cần implement Backend API/service
  - đã chốt: compare/report async qua ai_jobs, report versioning, Backend persist report, Owner/Editor tạo report, Owner delete report

- Docs cần cập nhật:
  - `docs/frontend-docs/API_CONTRACT_MVP.md`
  - `docs/backend/BE_AI_BOUNDARY_CONTRACT.md`
  - `docs/backend/BACKEND_STRUCTURE_GUIDE.md`
  - `docs/about-project/INSIGHTVAULT_AI_8_WEEK_PROJECT_PLAN.md`

## 11. Business rule đã chốt cuối ngày 2026-06-05

Đã chốt:

1. Workspace role giữ `Owner` / `Editor` / `Viewer`.
2. System Admin không được truy cập dữ liệu workspace; chỉ quản lý user/system/job monitoring.
3. Viewer được hỏi AI/RAG, nhưng không compare, generate report, download file gốc, delete hoặc hard delete trong MVP.
4. Editor được upload document và mutate content, nhưng không quản lý member.
5. Owner transfer không cần làm gấp trong MVP.
6. Invited member chỉ thấy invitation/workspace shell, không thấy nội dung.
7. Folder không có permission riêng; chỉ dùng workspace role.
8. Folder delete kéo theo soft delete folder con và documents trong cây đó.
9. Duplicate active file name trong cùng folder không được phép.
10. Soft delete document đưa vào Trash, hide chunks khỏi retrieval, chưa xóa MinIO object.
11. Hard delete trong Trash mới xóa metadata, chunks và MinIO object.
12. Owner được soft delete, restore và hard delete mọi document trong workspace; Editor chỉ được thực hiện các thao tác đó với document do chính mình upload; Viewer không được xóa.
13. `@folder` mặc định include subfolders.
14. Chat session private theo user.
15. Document chưa `Completed` không được dùng cho RAG.
16. RAG chat không tạo `AiJob`.
17. Web search chưa implement trong MVP.
18. Compare là user-triggered.
19. Compare/report chạy async qua `ai_jobs`.
20. Report dùng versioning.
21. Report có thể tạo theo folder bằng cách resolve folder thành document IDs.
22. Owner/Editor được tạo report; chỉ Owner được delete report.
23. Backend persist report; AI không tự ghi `reports`.
24. AI service MVP được đọc `documents`, đọc/ghi `document_chunks`; restricted DB user để phase sau.
25. Trash trong MVP không có auto retention; item chỉ bị xóa cứng khi Owner thực hiện, hoặc khi Editor thực hiện với document do chính Editor đó upload.
26. Virus scan upload bằng ClamAV hoặc service tương tự là security hardening cho phase sau, không thuộc MVP.
27. Owner transfer UX/API để phase sau MVP.

### 11.1. Deferred/Post-MVP

Các nội dung sau đã được chủ động hoãn, không phải câu hỏi mở và không chặn implement MVP:

1. **Virus scan upload:** tích hợp ClamAV hoặc malware-scanning service; file chỉ được đưa sang processing sau khi scan sạch. Nên triển khai async và có trạng thái scan/quarantine riêng.
2. **Owner transfer:** cho phép Owner chuyển quyền sở hữu workspace cho một active member khác, kèm validation để workspace luôn còn đúng một Owner.
3. **Trash auto retention:** có thể bổ sung policy tự hard delete sau một khoảng thời gian như 30 ngày. MVP chỉ hỗ trợ hard delete thủ công, không tự xóa theo thời gian.
4. **Restricted AI database user:** thu hẹp quyền database của AI service sau khi MVP ổn định; hiện AI được đọc `documents` và đọc/ghi `document_chunks`.
5. **Viewer original-file download:** hiện bị tắt trong MVP; chỉ xem xét mở lại nếu product requirement sau này cần.

## 12. Tóm tắt ngắn cho session mới

Hiện dự án đã có nền tảng upload/process document chạy được end-to-end với
Docker. Backend đã có auth/workspace/member/folder/document APIs, worker
RabbitMQ, ai-jobs APIs, report/compare APIs, dashboard/admin APIs, billing
credits, PayOS checkout/webhook và SMTP email queueing. AI service đã có
process/RAG/compare/report endpoints. Schema và AI service đã hỗ trợ RAG, nhưng
Backend Chat/RAG session/message APIs chưa implement.

Business rule mới đã chốt: workspace là môn học/project dùng chung; folder chỉ là cấu trúc phân loại; chat session private theo từng user trong workspace; RAG mặc định theo workspace và có thể scope bằng `@file`/`@folder`; Backend là system-of-record và chịu trách nhiệm permission/source resolution/report persistence; AI chỉ xử lý AI và được đọc/ghi `document_chunks` trong phạm vi MVP.

## 13. Implementation reading map

ChatSession implement code nên đọc theo thứ tự:

1. `docs/about-project/CURRENT_PROJECT_CONTEXT_FOR_BUSINESS_RULE_REVIEW.md`
   - Snapshot hiện trạng code/database và toàn bộ business decision đã chốt.
2. `docs/about-project/PROJECT_FEATURES_MVP.md`
   - Source of truth cho feature scope, role/permission, Trash, RAG, compare, report và danh sách deferred/post-MVP.
3. `docs/frontend-docs/API_CONTRACT_MVP.md`
   - API contract mục tiêu giữa Frontend và Backend, gồm chat mention, Trash, compare/report và permission.
4. `docs/backend/BE_AI_BOUNDARY_CONTRACT.md`
   - Ownership giữa Backend và AI service, source resolution, database access và persistence responsibility.
5. `docs/frontend-docs/UI_UX_SCREEN_SPEC_KNOWLEDGE_IDE.md`
   - Hành vi UI mục tiêu cho workspace explorer, chat, mention và các màn hình liên quan.
6. `docs/about-project/PROJECT_PLAN_MVP_BUILD.md`
   - Thứ tự triển khai và dependency giữa các module.

Khi nội dung giữa các tài liệu có khác biệt, ưu tiên business decision mới nhất trong file context này, sau đó đến `PROJECT_FEATURES_MVP.md`, `API_CONTRACT_MVP.md` và `BE_AI_BOUNDARY_CONTRACT.md`.
