# InsightVault AI - Kế hoạch triển khai 8 tuần

## 1. Bối cảnh và mục tiêu

Dự án InsightVault AI là một nền tảng web giúp nhóm project quản lý tài liệu trong workspace chung và dùng AI để tóm tắt, hỏi đáp, so sánh, phát hiện gap/conflict và tạo report từ tài liệu.

Mục tiêu tối thiểu trong kỳ này:

- Có AI hoạt động thật thông qua LLM API key.
- Có RAG chat dựa trên tài liệu đã upload.
- Có shared workspace, folder, document management và phân quyền member cơ bản.
- Có deploy được để demo.
- Nếu còn thời gian, dựng thêm bản mobile hoặc responsive/mobile-first thật tốt để lấy điểm cộng.

Thời gian còn lại: 8 tuần, bắt đầu từ tuần 3 đến tuần 10 của kỳ học.

## 2. Phạm vi MVP

### Trong phạm vi

- Google OAuth login và JWT nội bộ.
- Workspace CRUD.
- Workspace member và role: Owner, Editor, Viewer.
- Folder CRUD trong workspace.
- Upload document: PDF text-based, DOCX, TXT, Markdown.
- Lưu file gốc bằng MinIO.
- Lưu metadata bằng PostgreSQL.
- Xử lý tài liệu bằng AI service: extract text, clean text, chunking, embedding, summary.
- Lưu vector bằng pgvector.
- RAG chat trong workspace, hỗ trợ mention `@file` và `@folder` để giới hạn nguồn.
- Compare documents.
- Generate Markdown report.
- Dashboard user cơ bản.
- Admin monitoring cơ bản cho AI jobs và lỗi.
- Deploy frontend, backend, database/storage/vector stack theo phương án phù hợp.

### Ngoài phạm vi MVP

- Realtime editing.
- Realtime chat giữa members.
- OCR cho PDF scan.
- Export PDF/DOCX.
- Billing/payment.
- Knowledge graph nâng cao.
- Version control phức tạp cho tài liệu.

## 3. Phân vai tổng quan

| Thành viên | Vai trò chính | Phạm vi chính |
|---|---|---|
| An | Frontend | Layout shell, auth UI, dashboard, workspace screens |
| Nguyên | Frontend | Folder/document UI, upload flow, document detail, status UI |
| Phú | Frontend | AI chat UI, compare UI, report UI, responsive/mobile polish |
| Anh | Backend | Document upload, MinIO, AI jobs, summary/report/compare orchestration, admin monitoring |
| Kiệt | Backend/AI | RAG core, chunking, embedding, pgvector, chat answer with sources |
| Thịnh | Backend | Auth, user, workspace, member, role/permission |

### Ranh giới để tránh conflict

- Anh phụ trách backend orchestration: upload, MinIO, job lifecycle, gọi AI service, lưu metadata/kết quả vào database, report APIs và admin monitoring.
- Kiệt phụ trách AI/RAG internals: extract input text đã được backend cung cấp, chunking, embedding, pgvector operations, retrieval, prompt, Gemini call và structured AI result.
- Anh không implement trực tiếp chunking, embedding, vector search hoặc prompt logic.
- Kiệt không phụ trách upload file, MinIO object key, permission, job status API hoặc report persistence.
- Hai bạn thống nhất API contract giữa backend và AI service trước khi tích hợp: request fields, response fields, error format và timeout behavior.

## 4. Kế hoạch theo tuần

## Tuần 3 - Chốt scope, kiến trúc và khởi tạo project

Mục tiêu: cả team thống nhất MVP, dựng skeleton FE/BE/AI/database để bắt đầu code song song.

### An

- Khởi tạo React Vite + Tailwind project.
- Dựng app shell: login page placeholder, sidebar, topbar, workspace layout.
- Tạo routing cơ bản cho dashboard, workspaces, documents, AI chat, reports, admin.

### Nguyên

- Thiết kế UI flow cho folder/document: list folder, list document, upload modal, document detail.
- Tạo component skeleton cho table/list, empty state, loading state, error state.
- Chuẩn bị mock data cho folder/document để FE có thể chạy độc lập.

### Phú

- Thiết kế UI flow cho AI chat, compare documents và report viewer.
- Tạo mock screens cho chat message, source citation, compare result và markdown report.
- Kiểm tra responsive layout ban đầu cho desktop và mobile width.

### Thịnh

- Khởi tạo ASP.NET Core Web API project.
- Thiết kế database schema cho users, workspaces, workspace_members.
- Dựng JWT auth structure và Google OAuth callback flow ở mức skeleton.
- Viết API contract ban đầu cho auth/workspace/member.

### Kiệt

- Khởi tạo Python AI service hoặc module AI service theo kiến trúc team chọn.
- Đề xuất cấu trúc dữ liệu cần lưu cho document_chunks và vector metadata.
- Chốt chunking strategy ban đầu: chunk size, overlap, metadata cần lưu.
- Tạo prototype embedding một đoạn text bằng Gemini API.

### Anh

- Dựng Docker Compose cho PostgreSQL, pgvector và MinIO.
- Thiết kế schema cho folders, documents, document_chunks, ai_jobs, reports theo input từ Kiệt về vector metadata.
- Tạo skeleton API cho upload document và job status.
- Chốt convention lưu file trên MinIO: workspace/folder/document path hoặc object key.

## Tuần 4 - Auth, workspace/member và document upload

Mục tiêu: user login được, tạo workspace được, upload file vào workspace/folder được.

### An

- Làm login UI và xử lý trạng thái sau đăng nhập.
- Làm dashboard user cơ bản: số workspace, document, job status mock/real nếu API sẵn.
- Tích hợp auth token storage và protected routes.

### Nguyên

- Làm workspace list, workspace detail và folder list UI.
- Làm upload document modal/form.
- Tích hợp API folder/document list nếu backend đã sẵn sàng.

### Phú

- Làm member management UI: member list, invite by email, role badge, change role UI.
- Làm responsive navigation cho desktop/mobile.
- Chuẩn bị component source citation dùng chung cho AI chat sau này.

### Thịnh

- Hoàn thiện Google OAuth login và JWT nội bộ.
- Hoàn thiện CRUD workspace.
- Hoàn thiện invite/list/update/remove workspace member.
- Implement permission guard cho Owner, Editor, Viewer.

### Kiệt

- Tạo module chunk text từ plain text.
- Tạo module gọi embedding API và chuẩn hóa vector dimension.
- Tạo AI service function/API cho chunking, embedding và similarity search.
- Viết endpoint/test nội bộ để insert và similarity search thử.

### Anh

- Hoàn thiện upload document API.
- Lưu file vào MinIO và metadata vào PostgreSQL.
- Implement folder CRUD.
- Tạo ai_jobs khi upload document.
- Tạo status flow: pending_upload, uploaded, processing, completed, failed.
- Chuẩn bị backend contract để gọi AI service sau khi document được upload.

## Tuần 5 - Document processing và summary

Mục tiêu: upload xong thì hệ thống xử lý tài liệu, extract text, chunk, embedding và tạo summary.

### An

- Tích hợp dashboard với API thật cho workspace/document/job counters.
- Làm trạng thái document processing/completed/failed dễ nhìn trên UI.
- Làm toast/notification cho các thao tác chính.

### Nguyên

- Hoàn thiện document detail page: metadata, status, summary, key points, keywords.
- Hiển thị lỗi xử lý tài liệu nếu document failed.
- Tích hợp upload flow end-to-end với backend.

### Phú

- Làm markdown viewer component cho summary/report.
- Chuẩn bị AI action panel trên document detail: ask, compare, generate report.
- Test responsive cho document list/detail/upload.

### Thịnh

- Review permission cho folder/document APIs.
- Bảo đảm user chỉ truy cập được document trong workspace mình là member.
- Hỗ trợ Anh chuẩn hóa API response/error format.

### Kiệt

- Hoàn thiện chunking pipeline cho text đã extract.
- Hoàn thiện embedding và logic ghi/truy vấn chunks trong pgvector theo document_id, folder_id, workspace_id.
- Tạo similarity search theo workspace và explicit document ids được resolve từ `@file` / `@folder`.
- Viết test dữ liệu mẫu để kiểm tra retrieval có trả về chunk đúng.

### Anh

- Implement extract text cho PDF text-based, DOCX, TXT, Markdown.
- Implement worker/background job xử lý document.
- Gọi AI service để xử lý text đã extract và nhận lại summary, key points, keywords, chunk metadata.
- Lưu summary, key points, keywords vào bảng documents.
- Cập nhật document/job status dựa trên kết quả hoặc lỗi trả về từ AI service.

## Tuần 6 - RAG chat end-to-end

Mục tiêu: user hỏi AI và nhận câu trả lời dựa trên tài liệu đã upload, có nguồn trích dẫn.

### An

- Tích hợp source mention input cho `@file` và `@folder` trong phạm vi workspace.
- Làm trạng thái loading/error cho AI chat.
- Kiểm tra flow từ dashboard vào workspace rồi mở AI chat.

### Nguyên

- Bổ sung document sources preview ở document detail.
- Hỗ trợ FE integration cho mention `@file` và `@folder` trong chat input.
- Test các case document chưa xử lý xong thì không cho hỏi hoặc hiển thị cảnh báo.

### Phú

- Hoàn thiện AI chat UI: message list, input box, send button, answer block, source list.
- Tích hợp API RAG chat.
- Làm UX cho câu trả lời không đủ context hoặc không tìm thấy source.

### Thịnh

- Thiết kế và implement chat_sessions, chat_messages API.
- Áp permission vào chat scope.
- Lưu lịch sử hỏi đáp và sources trả về từ AI service.

### Kiệt

- Implement RAG query pipeline: embed question, retrieve top-k chunks, build prompt, call Gemini, return answer.
- Trả về sources gồm document_id, chunk_id, file_name, snippet.
- Tối ưu prompt để AI trả lời dựa trên context, không bịa khi thiếu dữ liệu.
- Expose RAG endpoint/function cho backend gọi với workspace hoặc explicit document ids rõ ràng.
- Test ít nhất 5 câu hỏi demo từ proposal/requirement mẫu.

### Anh

- Hỗ trợ orchestration giữa backend và AI service cho chat API, không xử lý retrieval/prompt trong backend.
- Log lỗi AI call và timeout.
- Bổ sung ai_jobs hoặc logs cho các tác vụ AI quan trọng nếu cần monitor.

## Tuần 7 - Compare documents, gap/conflict và report

Mục tiêu: có các tính năng AI tạo insight ngoài chat: compare, detect gap/conflict, generate Markdown report.

### An

- Làm compare entry từ workspace/document list.
- Làm dashboard hiển thị report count và recent activity cơ bản.
- Polish workspace detail để demo dễ theo dõi.

### Nguyên

- Làm UI chọn nhiều documents để compare hoặc generate report.
- Hiển thị document readiness để chỉ chọn file đã completed.
- Test upload nhiều loại file và trạng thái xử lý.

### Phú

- Hoàn thiện compare result UI: similarities, differences, missing content, potential conflicts, suggestions.
- Hoàn thiện report viewer UI cho Markdown report.
- Làm thao tác copy/download Markdown nếu kịp.

### Thịnh

- Bổ sung API permission cho compare/report theo workspace role.
- Review toàn bộ API auth/authorization.
- Chuẩn hóa seed/demo user và workspace nếu cần.

### Kiệt

- Implement retrieval/context preparation cho compare nhiều documents.
- Implement AI prompt cho gap/conflict detection.
- Trả kết quả compare/gap/conflict có cấu trúc để backend lưu và FE render ổn định.

### Anh

- Implement reports table và report APIs.
- Orchestrate compare job/report job bằng cách gọi AI service của Kiệt.
- Lưu compare result và Markdown report do AI service trả về.
- Bổ sung admin API xem AI jobs gần đây và job failed.

## Tuần 8 - Admin, hardening và tích hợp toàn hệ thống

Mục tiêu: hoàn thiện MVP, xử lý lỗi, chuẩn hóa demo flow, bắt đầu chuẩn bị deploy.

### An

- Hoàn thiện user dashboard với số liệu thật.
- Làm admin dashboard cơ bản nếu account có role admin.
- Kiểm tra navigation end-to-end cho demo flow.

### Nguyên

- Polish folder/document UX: empty state, failed state, retry hint nếu có.
- Kiểm tra upload file lớn vừa phải và file sai định dạng.
- Sửa các lỗi UI phát sinh khi API trả lỗi.

### Phú

- Polish AI chat/compare/report UI.
- Tối ưu responsive/mobile web để có thể demo tốt trên điện thoại.
- Chuẩn bị mobile bonus path: nếu không build app native thì đảm bảo PWA/responsive thật tốt.

### Thịnh

- Hardening auth, role/permission và API validation.
- Viết integration tests hoặc manual test checklist cho auth/workspace/member.
- Chuẩn bị config môi trường production cho backend.

### Kiệt

- Tối ưu retrieval: top-k, threshold, chunk overlap, source formatting.
- Test RAG với nhiều tài liệu để giảm trả lời sai context.
- Bổ sung fallback khi embedding/LLM API lỗi.

### Anh

- Hoàn thiện admin monitoring: total users, total AI jobs, failed jobs, recent errors.
- Chuẩn bị Dockerfile/Docker Compose production-like.
- Kiểm tra MinIO/PostgreSQL/pgvector config cho deploy.

## Tuần 9 - Deploy, testing và demo rehearsal

Mục tiêu: deploy được bản chạy thật và test demo nhiều vòng.

### An

- Kiểm tra frontend production build.
- Sửa lỗi môi trường khi gọi API deployed.
- Chuẩn bị tài khoản/user flow demo.

### Nguyên

- Test document/folder/upload trên môi trường deployed.
- Chuẩn bị bộ tài liệu demo: proposal, requirement, meeting note, report draft.
- Ghi lại các lỗi UI/API cần sửa trước tuần cuối.

### Phú

- Test AI chat, compare, report trên môi trường deployed.
- Polish responsive/mobile cuối cùng.
- Chuẩn bị kịch bản demo UI theo luồng 12 bước trong proposal.

### Thịnh

- Deploy backend API.
- Cấu hình Google OAuth redirect URI cho môi trường deployed.
- Kiểm tra CORS, JWT, environment variables và logs.

### Kiệt

- Deploy AI service hoặc hỗ trợ đóng gói AI module.
- Kiểm tra Gemini API key, embedding, vector search trên môi trường deployed.
- Benchmark nhẹ RAG latency và sửa lỗi timeout nếu có.

### Anh

- Deploy PostgreSQL/pgvector và MinIO hoặc chọn dịch vụ thay thế phù hợp.
- Deploy worker/background job.
- Kiểm tra document processing end-to-end trên môi trường deployed.

## Tuần 10 - Final polish, báo cáo và bảo vệ

Mục tiêu: ổn định sản phẩm, chuẩn bị tài liệu nộp và demo tự tin.

### An

- Polish dashboard/workspace screens.
- Chuẩn bị screenshot UI cho báo cáo.
- Hỗ trợ quay video demo nếu môn yêu cầu.

### Nguyên

- Polish document management flow.
- Chuẩn bị phần trình bày về upload, folder, document status và summary.
- Kiểm tra lại toàn bộ file demo trước buổi bảo vệ.

### Phú

- Polish AI chat/compare/report screens.
- Chuẩn bị phần trình bày AI value: RAG, compare, gap/conflict, report.
- Kiểm tra mobile/responsive để tận dụng điểm cộng.

### Thịnh

- Chuẩn bị phần trình bày backend architecture: auth, workspace, member, permission.
- Review API logs và fix lỗi nghiêm trọng cuối cùng.
- Đóng băng scope, chỉ sửa bug blocker.

### Kiệt

- Chuẩn bị phần trình bày RAG: chunking, embedding, pgvector, retrieval, prompt, sources.
- Chuẩn bị ví dụ hỏi đáp chứng minh AI trả lời dựa trên tài liệu.
- Fix lỗi RAG ảnh hưởng trực tiếp đến demo.

### Anh

- Chuẩn bị phần trình bày document pipeline: MinIO, AI jobs, extraction, summary, report/compare orchestration.
- Kiểm tra deploy health trước demo.
- Chuẩn bị backup plan nếu AI API hoặc deploy lỗi: dữ liệu demo đã xử lý sẵn và screenshots/video.

## 5. Luồng demo nên bám sát

1. User login bằng Google.
2. Tạo workspace "InsightVault AI Project".
3. Mời một thành viên vào workspace.
4. Tạo folder "Project Documents".
5. Upload proposal và requirement.
6. Hệ thống xử lý tài liệu.
7. Xem summary của từng tài liệu.
8. Hỏi AI: "MVP của project gồm những chức năng nào?"
9. Compare proposal với requirement.
10. AI phát hiện requirement thiếu phần generate report hoặc một gap tương tự.
11. Generate Markdown report từ folder.
12. Admin xem job status/dashboard.

## 6. Thứ tự ưu tiên nếu bị thiếu thời gian

### Bắt buộc phải giữ

- Login.
- Workspace/folder/document upload.
- Document processing.
- Chunking + embedding + pgvector.
- RAG chat có sources.
- Deploy.

### Nên có để dự án khác biệt

- Summary.
- Compare documents.
- Gap/conflict detection.
- Generate Markdown report.
- Dashboard cơ bản.

### Có thì tốt, không có vẫn không vỡ MVP

- Admin monitoring đầy đủ.
- Mobile app native.
- Export Markdown file.
- Retry job tự động.
- Activity log chi tiết.

## 7. Checklist validation cuối kỳ

- User đăng nhập Google thành công trên môi trường deployed.
- User tạo workspace, folder và upload tài liệu thành công.
- File gốc tồn tại trong MinIO hoặc storage đã chọn.
- Metadata document lưu trong PostgreSQL.
- Document chuyển status từ pending_upload/uploaded/processing sang completed.
- Chunks và embeddings được lưu trong pgvector.
- RAG chat trả lời đúng dựa trên tài liệu và có sources.
- Compare documents trả về điểm giống, khác, thiếu và conflict tiềm năng.
- Generate report tạo được Markdown report.
- Viewer không thực hiện được thao tác chỉ dành cho Owner/Editor.
- Viewer hỏi AI được trong phạm vi workspace/folder/document được phép đọc.
- Frontend production build không lỗi.
- Backend, AI service, database/storage chạy được trên môi trường deployed.
