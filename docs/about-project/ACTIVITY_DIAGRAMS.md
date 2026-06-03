# InsightVault AI - Activity Diagrams

Tài liệu này mô tả các Activity Diagrams cho các luồng quy trình (workflow) chính trong MVP của InsightVault AI, dựa trên file `PROJECT_FEATURES_MVP.md`. Các sơ đồ được vẽ bằng Mermaid.

## 1. Luồng Đăng nhập (Google OAuth Authentication Flow)

Mô tả quá trình người dùng đăng nhập vào hệ thống sử dụng tài khoản Google.

```mermaid
flowchart TD
    Start((Bắt đầu)) --> ChooseLogin[Chọn 'Login with Google']
    ChooseLogin --> GoogleAuth{Xác thực qua\nGoogle OAuth}
    GoogleAuth -- Thất bại --> AuthError[Hiển thị lỗi đăng nhập]
    AuthError --> ChooseLogin
    GoogleAuth -- Thành công --> BackendReceive[Backend nhận Identity từ Google]
    BackendReceive --> CheckUser{User đã tồn tại?}
    CheckUser -- Có --> UpdateUser[Cập nhật thông tin user]
    CheckUser -- Không --> CreateUser[Tạo tài khoản user mới]
    UpdateUser --> GenJWT[Tạo JWT nội bộ]
    CreateUser --> GenJWT
    GenJWT --> ReturnToken[Trả về Token cho Client]
    ReturnToken --> SaveToken[Client lưu Token\nvào LocalStorage/Cookie]
    SaveToken --> Redirect[Chuyển hướng đến Dashboard]
    Redirect --> End((Kết thúc))
```

---

## 2. Luồng Tải lên và Xử lý Tài liệu (Document Upload & Background Processing Flow)

Mô tả quá trình người dùng upload file, lưu trữ file và hệ thống background tự động xử lý (chunking, embedding, summary).

```mermaid
flowchart TD
    Start((Bắt đầu)) --> SelectWorkspace[Chọn Workspace & Folder]
    SelectWorkspace --> SelectFile[Chọn file tài liệu]
    SelectFile --> ValidateFile{Kiểm tra định dạng\nvà kích thước}
    ValidateFile -- Không hợp lệ --> ErrorMsg[Hiển thị lỗi file không hợp lệ]
    ErrorMsg --> SelectFile
    ValidateFile -- Hợp lệ --> UploadMinIO[Upload file gốc lên MinIO]
    UploadMinIO --> SaveMetadata[Lưu metadata vào PostgreSQL\nStatus: uploaded]
    SaveMetadata --> CreateAIJob[Tạo AI Job 'process_document'\nStatus: pending]
    CreateAIJob --> ReturnSuccess[Trả về kết quả Upload thành công]
    ReturnSuccess --> BackgroundService((Background\nService))

    BackgroundService --> JobRun[Lấy Job 'process_document' đang pending]
    JobRun --> UpdateProcessing[Cập nhật status\nJob: processing\nDoc: processing]
    UpdateProcessing --> ExtractText[Trích xuất và làm sạch text từ file MinIO]
    ExtractText --> ChunkText[Chia nhỏ text thành Chunks\nvà đếm Token]
    ChunkText --> CallEmbedding[Gọi Gemini Embedding API]
    
    CallEmbedding -- Thành công --> SaveVector[Lưu Chunks & Vectors\nvào pgvector]
    SaveVector --> GenerateSummary[Gọi Gemini API tạo Summary/Keywords]
    GenerateSummary --> UpdateSuccess[Cập nhật status = completed]
    UpdateSuccess --> EndProcess((Kết thúc xử lý))
    
    CallEmbedding -- Lỗi --> UpdateFailed[Cập nhật status = failed\nvà lưu lỗi]
    ExtractText -- Lỗi --> UpdateFailed
    UpdateFailed --> EndProcess
```

---

## 3. Luồng Hỏi đáp RAG (RAG Chat Flow)

Mô tả quá trình người dùng đặt câu hỏi và AI tìm kiếm ngữ cảnh từ tài liệu để trả lời (Retrieval-Augmented Generation).

```mermaid
flowchart TD
    Start((Bắt đầu)) --> ChooseScope[Chọn Phạm vi (Scope)\nWorkspace / Folder / Document]
    ChooseScope --> EnterQuery[Nhập câu hỏi (Query)]
    EnterQuery --> CreateChatMsg[Lưu Chat Message vào DB]
    CreateChatMsg --> GenQueryEmbedding[Tạo Embedding cho Query\n(Gemini Embedding API)]
    GenQueryEmbedding --> VectorSearch[Tìm kiếm Semantic Search pgvector\n(Lọc theo quyền và Scope)]
    VectorSearch --> GetContext[Lấy Top-K Chunks liên quan nhất]
    GetContext --> BuildPrompt[Xây dựng Prompt\n(System Prompt + Context + Query)]
    BuildPrompt --> CallGemini[Gọi Gemini API sinh câu trả lời]
    CallGemini --> ReceiveResponse[Nhận câu trả lời từ AI]
    ReceiveResponse --> SaveResponse[Lưu câu trả lời và Sources vào DB]
    SaveResponse --> DisplayResult[Hiển thị câu trả lời & Trích dẫn cho User]
    DisplayResult --> End((Kết thúc))
```

---

## 4. Luồng So sánh Tài liệu và Tạo Report (Document Comparison & Report Generation Flow)

Mô tả quá trình người dùng chọn nhiều tài liệu để AI tự động so sánh, phân tích gap/conflict và tạo báo cáo Markdown.

```mermaid
flowchart TD
    Start((Bắt đầu)) --> SelectDocs[Chọn 2 hoặc nhiều Documents]
    SelectDocs --> ClickCompare[Nhấn 'Compare' / 'Generate Report']
    ClickCompare --> ChooseType[Chọn loại Report\n(VD: Comparison, Gap Analysis)]
    ChooseType --> RequestCompare[Gửi yêu cầu tạo Report]
    RequestCompare --> CreateReportJob[Tạo AI Job 'generate_report']
    CreateReportJob --> ReturnJobId[Trả về Job ID cho Client]
    ReturnJobId --> BackgroundWorker((Background\nWorker))

    BackgroundWorker --> JobRun[Lấy Job 'generate_report']
    JobRun --> GetDocContent[Lấy nội dung (Summary/Chunks)\ncủa các Documents đã chọn]
    GetDocContent --> BuildComparePrompt[Tạo Prompt so sánh / phân tích]
    BuildComparePrompt --> CallAICompare[Gọi Gemini API]
    CallAICompare --> ReceiveMarkdown[Nhận kết quả định dạng Markdown]
    ReceiveMarkdown --> SaveReport[Lưu Report vào bảng reports]
    SaveReport --> UpdateJobState[Cập nhật Job status = completed]
    UpdateJobState --> EndWorker((Kết thúc xử lý))

    ReturnJobId -. Client polling/socket .-> CheckStatus{Job đã xong?}
    CheckStatus -- Xong --> ViewReport[User xem nội dung Report]
    CheckStatus -- Chưa --> CheckStatus
```

---

## 5. Luồng Quản lý Workspace & Member (Workspace & Member Management Flow)

Mô tả quy trình tạo Workspace và mời thành viên cùng làm việc.

```mermaid
flowchart TD
    Start((Bắt đầu)) --> UserAction{User chọn hành động}
    
    UserAction -- Tạo Workspace --> CreateWS[Nhập thông tin Workspace]
    CreateWS --> SaveWS[Lưu vào DB\nGán User hiện tại làm Owner]
    SaveWS --> WSReady((Workspace\nsẵn sàng))
    
    UserAction -- Mời Member --> EnterEmail[Nhập Email & chọn Role\n(Editor/Viewer)]
    EnterEmail --> CheckOwner{User có quyền Owner?}
    CheckOwner -- Không --> ErrorPerm[Báo lỗi không đủ quyền]
    CheckOwner -- Có --> SaveMember[Thêm vào workspace_members]
    SaveMember --> SendInviteEmail[Gửi Email thông báo (Optional)]
    SendInviteEmail --> MemberAdded((Thành viên\nđược thêm))
```
