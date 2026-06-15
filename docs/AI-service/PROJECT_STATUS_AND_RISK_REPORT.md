# Báo Cáo Tiến Độ Dự Án & Phân Tích Rủi Ro (MVP)

Ngày kiểm tra ban đầu: 2026-05-26

Update 2026-06-15: this report is now historical. The current project status is
tracked in `docs/about-project/CURRENT_PROJECT_STATUS.md`. Backend API,
frontend routes, RabbitMQ workers, report/compare, admin/dashboard, billing,
PayOS, and SMTP queueing have been added since this report was written. The
main remaining backend gap is Chat/RAG session/message APIs, not the whole
backend.

Dựa trên kế hoạch `PROJECT_PLAN_MVP_BUILD.md` và `PROJECT_FEATURES_MVP.md`, dưới đây là đánh giá tổng quan về những việc đã hoàn thành, những phần còn thiếu, và các rủi ro hệ thống hiện tại.

## 1. Trạng Thái Hoàn Thành (What's Done)

✅ **Infrastructure (Sprint 0)**
- Đã cấu hình Docker Compose cho PostgreSQL (pgvector) và MinIO.
- Đã có script `start-docker.ps1`.

✅ **Database Schema (Sprint 0)**
- Đã tạo toàn bộ các Entity (C#) và EF Core Migrations cho tất cả bảng (`Users`, `Workspaces`, `Documents`, `AiJobs`, `Reports`, `ChatSessions`, v.v.).

✅ **AI Service (Sprint 3, 4, 5)**
- Hoàn thành 100% các API cho Python AI Service:
  - `/process-document`: Trích xuất text, chunking, embedding, lưu pgvector, tạo summary.
  - `/rag/query`: RAG theo workspace hoặc explicit `document_ids`; `@folder` sẽ do Backend resolve thành `document_ids`.
  - `/compare`: So sánh điểm tương đồng, mâu thuẫn giữa các tài liệu.
  - `/generate-report`: Tự động viết báo cáo Markdown.
- Test tự động (Unit/API tests) đã passing.

---

## 2. Những Task / Tính Năng Còn Thiếu (What's Missing)

Tiến độ hiện tại không còn khuyết toàn bộ Backend API và Frontend UI. Phần này
được giữ lại như lịch sử của ngày 2026-05-26; xem trạng thái mới trong
`CURRENT_PROJECT_STATUS.md`.

### 2.1. Về phía Backend (.NET 10)
- **Đã lỗi thời**: backend hiện có nhiều Controllers/Services. Gap còn lại là
  Chat/RAG API layer.
- **Sprint 1 (Auth & Workspace)**: Chưa có tích hợp Google OAuth 2.0, chưa có cơ chế cấp phát và xác thực JWT. Chưa có API CRUD cho Workspace/Member.
- **Sprint 2 (MinIO Upload)**: Chưa có code AWS S3 SDK (MinIO client) để upload file từ FE lên MinIO.
- **Sprint 3 (Background Worker)**: Chưa có `.NET BackgroundService` để đọc `AiJobs` từ database và gọi HTTP Request sang Python `ai-service`.
- **Sprint 4 & 5 (Nghiệp vụ)**: Chưa có các API phục vụ Chat, Compare, Report để Frontend gọi vào.

### 2.2. Về phía Frontend (React + Vite)
- **UI/UX**: Chỉ mới có file `App.tsx` mặc định.
- **Chưa có các Pages**: Login, Workspace List, Document Manager, Chat UI, Report Dashboard.
- **Tích hợp API**: Chưa có Axios/Fetch config để gắn kết với Backend.

---

## 3. Phân Tích Rủi Ro (Risk Assessment)

⚠️ **Rủi Ro 1: Nghẽn cổ chai tích hợp (Integration Bottleneck)**
- Hiện tại AI Service đã xong nhưng Backend không có API nào để test E2E. Khi Backend hoàn thiện, việc ghép nối giữa C# Worker và Python FastAPI có thể phát sinh lỗi về payload (ví dụ: sai format `folder_id`, `document_id`).
- **Giải pháp**: Backend cần ưu tiên làm `BackgroundService` để gọi thử sang `ai-service` ngay khi làm xong tính năng upload.

⚠️ **Rủi Ro 2: Giới hạn Quota API Gemini (Rate Limit)**
- Model `gemini-2.5-flash` có giới hạn Free Tier rất khắt khe (chỉ khoảng 20 requests/ngày). Trong quá trình Frontend và Backend dev test luồng RAG và Compare, API key sẽ rất dễ bị báo lỗi `429 Too Many Requests` (đã từng xảy ra khi chạy `quick_e2e.py`).
- **Giải pháp**: Team cần chuẩn bị sẵn nhiều Google API Keys để xoay vòng lúc test, hoặc nâng cấp lên gói Pay-as-you-go. Có thể cấu hình `GEMINI_CHAT_MODEL=gemini-1.5-flash` để hạn mức rộng rãi hơn.

⚠️ **Rủi Ro 3: Bảo mật MinIO và File Download**
- Backend sẽ upload file lên MinIO và truyền `minio_object_key` cho AI Service. Tuy nhiên, nếu Frontend muốn tải file về để xem (Preview), Backend cần phải sinh ra các Pre-signed URL an toàn.
- **Giải pháp**: Thêm cấu hình tạo Pre-signed URL (hết hạn sau 1 giờ) vào MinIO Service của Backend.

⚠️ **Rủi Ro 4: Google OAuth Logic**
- Việc cấu hình redirect URI cho Google OAuth giữa môi trường localhost của React và .NET dễ gây lỗi CORS hoặc Invalid token.
- **Giải pháp**: Backend Lead cần setup chuẩn CORS policy và test API Postman trước khi Frontend ráp vào.

⚠️ **Rủi Ro 5: Chia sẻ chung Database (EF Core vs SQLAlchemy/psycopg2)**
- Backend dùng EF Core quản lý migration, nhưng `ai-service` lại thao tác trực tiếp bằng `psycopg2` vào bảng `document_chunks` và `reports`. Nếu Backend chạy migration làm drop/alter các bảng này mà AI Service không biết, hệ thống sẽ sập.
- **Giải pháp**: Chỉ dùng EF Core (Backend) để thay đổi Schema (Migrations). AI Service tuyệt đối chỉ thực hiện DML (Insert, Update, Delete), không được thay đổi cấu trúc bảng. Cấu trúc bảng `document_chunks` và `reports` bên C# đã chuẩn bị sẵn, nên hiện tại đang an toàn.
