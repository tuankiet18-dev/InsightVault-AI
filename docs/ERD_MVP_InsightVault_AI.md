# ERD MVP - InsightVault AI

## 1. Mục Tiêu Thiết Kế

ERD này được thiết kế cho MVP của **InsightVault AI**: một collaborative AI-powered knowledge workspace cho nhóm project.

MVP hỗ trợ:

- Đăng nhập bằng Google OAuth.
- Phân quyền hệ thống `user/admin`.
- Shared workspace với member roles `owner/editor/viewer`.
- Folder và document management.
- Lưu file gốc trên MinIO.
- Lưu metadata, chunk text và vector embedding trong PostgreSQL + pgvector.
- Xử lý tài liệu bằng background job.
- RAG chat theo workspace/folder/document.
- So sánh tài liệu, phát hiện gap/conflict và lưu kết quả dưới dạng report.
- Tạo Markdown report.

Thiết kế hỗ trợ co-work cơ bản qua bảng `workspace_members`. MVP không hỗ trợ realtime editing, cursor presence hoặc realtime team chat.

## 2. Công Nghệ Liên Quan Đến ERD

| Thành phần | Công nghệ |
|---|---|
| Authentication | Google OAuth + JWT nội bộ |
| Backend | ASP.NET Core Web API |
| AI Service | Python service |
| AI Provider | Gemini API |
| Embedding Model | Gemini Embedding API |
| Database | PostgreSQL |
| Vector Search | pgvector |
| File Storage | MinIO |
| Background Job | `.NET BackgroundService + ai_jobs`; RabbitMQ optional |

## 3. Danh Sách Bảng

ERD MVP gồm 10 bảng:

1. `users`
2. `workspaces`
3. `workspace_members`
4. `folders`
5. `documents`
6. `document_chunks`
7. `ai_jobs`
8. `chat_sessions`
9. `chat_messages`
10. `reports`

## 4. Mô Tả Bảng

### 4.1. users

Lưu thông tin tài khoản người dùng đăng nhập bằng Google OAuth.

Điểm quan trọng:

- Không lưu mật khẩu vì hệ thống không dùng đăng nhập bằng password.
- `google_subject` là định danh duy nhất do Google cung cấp.
- `role` phân biệt user thường và admin.
- `is_active` cho phép admin khóa hoặc mở tài khoản.

### 4.2. workspaces

Lưu workspace do user tạo.

`owner_id` xác định owner chính của workspace. Tuy nhiên quyền truy cập thực tế vẫn phải kiểm tra qua `workspace_members`.

Khi tạo workspace, hệ thống nên tạo luôn một record trong `workspace_members` cho owner:

```text
workspace_members.role = owner
workspace_members.status = active
```

### 4.3. workspace_members

Lưu thành viên và quyền của từng user trong workspace.

Role:

- `owner`: quản lý workspace và thành viên.
- `editor`: upload document, tạo folder, dùng AI features, tạo report.
- `viewer`: xem tài liệu, summary, report và có thể dùng chức năng đọc.

Status:

- `invited`: đã được mời nhưng chưa tham gia.
- `active`: đang là member.
- `removed`: đã bị remove khỏi workspace.

Bảng này là nguồn phân quyền chính cho workspace.

### 4.4. folders

Lưu folder/section bên trong workspace.

Một workspace có nhiều folder. Tên folder trong cùng một workspace nên unique.

### 4.5. documents

Lưu metadata của tài liệu đã upload.

File gốc không lưu trực tiếp trong database. File được lưu trong MinIO, database chỉ lưu:

```text
storage_bucket
storage_object_key
```

Bảng này cũng lưu summary cơ bản:

- `summary`
- `key_points`
- `keywords`

Lý do gộp summary vào `documents`: MVP chỉ cần bản summary mới nhất cho mỗi document, chưa cần versioning.

### 4.6. document_chunks

Lưu các đoạn văn bản sau khi tài liệu được extract và chunk.

Mỗi chunk có:

- Nội dung text.
- Số token.
- Embedding vector.
- Metadata bổ sung.

Cột `embedding` dùng kiểu `vector(768)` của pgvector. Nếu dbdiagram.io không hỗ trợ kiểu này khi vẽ, có thể đổi tạm thành `text`, nhưng khi triển khai PostgreSQL thật nên dùng pgvector.

### 4.7. ai_jobs

Lưu trạng thái các tác vụ AI/background job.

Job types:

- `process_document`
- `generate_report`
- `compare_documents`

MVP mặc định dùng `.NET BackgroundService + ai_jobs`. RabbitMQ chỉ là optional để trigger worker, không thay thế bảng tracking này.

### 4.8. chat_sessions

Lưu một phiên chat giữa user và hệ thống.

Chat có thể theo một trong ba scope:

- `workspace`
- `folder`
- `document`

`folder_id` và `document_id` có thể null tùy theo `scope_type`.

### 4.9. chat_messages

Lưu từng message trong một chat session.

`sender_type`:

- `user`
- `assistant`
- `system`

`sources_json` lưu các chunk được dùng làm nguồn khi AI trả lời.

Ví dụ:

```json
[
  {
    "document_id": 1,
    "chunk_id": 15,
    "similarity_score": 0.86
  }
]
```

Thiết kế này giúp MVP có citation/source mà không cần thêm bảng `message_sources`.

### 4.10. reports

Lưu báo cáo do AI tạo.

Report types:

- `summary_report`
- `comparison_report`
- `gap_analysis_report`
- `section_report`

Kết quả compare documents lưu trong `reports` với:

```text
report_type = comparison_report
```

MVP không cần bảng `compare_results` riêng.

## 5. Quan Hệ Chính

```text
users 1 - n workspaces
users 1 - n workspace_members
workspaces 1 - n workspace_members
workspaces 1 - n folders
folders 1 - n documents
documents 1 - n document_chunks
workspaces 1 - n ai_jobs
documents 1 - n ai_jobs
users 1 - n chat_sessions
workspaces 1 - n chat_sessions
chat_sessions 1 - n chat_messages
workspaces 1 - n reports
users 1 - n reports
```

## 6. DBML Cho dbdiagram.io

```dbml
Enum user_role {
  user
  admin
}

Enum workspace_member_role {
  owner
  editor
  viewer
}

Enum workspace_member_status {
  invited
  active
  removed
}

Enum document_status {
  uploaded
  processing
  completed
  failed
}

Enum ai_job_type {
  process_document
  generate_report
  compare_documents
}

Enum ai_job_status {
  pending
  processing
  completed
  failed
}

Enum chat_sender_type {
  user
  assistant
  system
}

Enum chat_scope_type {
  workspace
  folder
  document
}

Table users {
  id integer [pk, increment]
  email varchar(255) [unique, not null]
  full_name varchar(255) [not null]
  avatar_url varchar(500)
  google_subject varchar(255) [unique, not null]
  role user_role [default: 'user']
  is_active boolean [default: true]
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  updated_at timestamp
  last_login_at timestamp
}

Table workspaces {
  id integer [pk, increment]
  owner_id integer [not null]
  name varchar(255) [not null]
  description text
  ai_system_prompt text
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  updated_at timestamp
}

Table workspace_members {
  id integer [pk, increment]
  workspace_id integer [not null]
  user_id integer [not null]
  role workspace_member_role [default: 'viewer']
  status workspace_member_status [default: 'active']
  invited_by integer
  invited_at timestamp
  joined_at timestamp
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  updated_at timestamp

  indexes {
    (workspace_id, user_id) [unique]
  }
}

Table folders {
  id integer [pk, increment]
  workspace_id integer [not null]
  created_by integer [not null]
  name varchar(255) [not null]
  description text
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  updated_at timestamp

  indexes {
    (workspace_id, name) [unique]
  }
}

Table documents {
  id integer [pk, increment]
  folder_id integer [not null]
  uploaded_by integer [not null]
  original_file_name varchar(255) [not null]
  file_type varchar(50) [not null]
  file_size_bytes integer
  storage_bucket varchar(255) [not null]
  storage_object_key varchar(500) [not null]
  status document_status [default: 'uploaded']
  summary text
  key_points text
  keywords text
  error_message text
  uploaded_at timestamp [default: `CURRENT_TIMESTAMP`]
  processed_at timestamp
  updated_at timestamp
}

Table document_chunks {
  id integer [pk, increment]
  document_id integer [not null]
  chunk_index integer [not null]
  content text [not null]
  token_count integer [default: 0]
  embedding vector(768)
  metadata jsonb
  created_at timestamp [default: `CURRENT_TIMESTAMP`]

  indexes {
    (document_id, chunk_index) [unique]
  }
}

Table ai_jobs {
  id integer [pk, increment]
  workspace_id integer [not null]
  document_id integer
  created_by integer
  job_type ai_job_type [not null]
  status ai_job_status [default: 'pending']
  retry_count integer [default: 0]
  result_json jsonb
  error_message text
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  started_at timestamp
  completed_at timestamp
}

Table chat_sessions {
  id integer [pk, increment]
  workspace_id integer [not null]
  user_id integer [not null]
  folder_id integer
  document_id integer
  scope_type chat_scope_type [not null]
  title varchar(255) [not null]
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  updated_at timestamp
}

Table chat_messages {
  id integer [pk, increment]
  session_id integer [not null]
  sender_type chat_sender_type [not null]
  content text [not null]
  sources_json jsonb
  ai_model varchar(100)
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
}

Table reports {
  id integer [pk, increment]
  workspace_id integer [not null]
  created_by integer [not null]
  title varchar(255) [not null]
  report_type varchar(50) [not null]
  content_markdown text [not null]
  source_document_ids jsonb
  result_json jsonb
  ai_model varchar(100)
  created_at timestamp [default: `CURRENT_TIMESTAMP`]
  updated_at timestamp
}

Ref: users.id < workspaces.owner_id [delete: cascade]

Ref: workspaces.id < workspace_members.workspace_id [delete: cascade]
Ref: users.id < workspace_members.user_id [delete: cascade]
Ref: users.id < workspace_members.invited_by [delete: set null]

Ref: workspaces.id < folders.workspace_id [delete: cascade]
Ref: users.id < folders.created_by [delete: set null]

Ref: folders.id < documents.folder_id [delete: cascade]
Ref: users.id < documents.uploaded_by [delete: set null]

Ref: documents.id < document_chunks.document_id [delete: cascade]

Ref: workspaces.id < ai_jobs.workspace_id [delete: cascade]
Ref: documents.id < ai_jobs.document_id [delete: set null]
Ref: users.id < ai_jobs.created_by [delete: set null]

Ref: workspaces.id < chat_sessions.workspace_id [delete: cascade]
Ref: users.id < chat_sessions.user_id [delete: cascade]
Ref: folders.id < chat_sessions.folder_id [delete: set null]
Ref: documents.id < chat_sessions.document_id [delete: set null]

Ref: chat_sessions.id < chat_messages.session_id [delete: cascade]

Ref: workspaces.id < reports.workspace_id [delete: cascade]
Ref: users.id < reports.created_by [delete: set null]
```

## 7. Luồng Dữ Liệu Tương Ứng Với ERD

### 7.1. Đăng Nhập

```text
User đăng nhập bằng Google
-> Backend nhận Google identity
-> Tạo hoặc cập nhật users
-> Phát hành JWT nội bộ cho frontend
```

### 7.2. Tạo Shared Workspace

```text
User tạo workspace
-> Tạo record workspaces
-> Tạo record workspace_members với role owner
```

### 7.3. Mời Thành Viên

```text
Owner mời user bằng email
-> Tạo/cập nhật workspace_members
-> Member truy cập workspace theo role được gán
```

### 7.4. Upload Tài Liệu

```text
Owner/Editor upload file
-> Kiểm tra workspace permission
-> File lưu vào MinIO
-> Metadata lưu vào documents
-> Tạo ai_jobs với type process_document
```

### 7.5. Xử Lý Tài Liệu

```text
Background job lấy document
-> Đọc file từ MinIO
-> Extract text
-> Chunk text
-> Gọi Gemini Embedding API
-> Lưu chunk + embedding vào document_chunks
-> Lưu summary/key_points/keywords vào documents
-> Cập nhật documents.status = completed
```

### 7.6. Chat RAG

```text
User tạo chat session
-> Gửi câu hỏi
-> Kiểm tra membership theo workspace
-> Query được embedding
-> pgvector tìm document_chunks liên quan theo scope
-> Context gửi sang Gemini API
-> Câu trả lời lưu vào chat_messages
-> Sources lưu vào chat_messages.sources_json
```

### 7.7. Generate Report Hoặc Compare Documents

```text
User yêu cầu generate report hoặc compare documents
-> Kiểm tra workspace role
-> Tạo ai_jobs
-> Lấy document chunks liên quan
-> Gửi context sang Gemini API
-> Lưu kết quả vào reports
```

## 8. Lưu Ý Mở Rộng Sau MVP

Nếu sau này cần mở rộng, có thể thêm:

- `document_summaries`: lưu nhiều phiên bản summary.
- `message_sources`: chuẩn hóa citation/source thay vì dùng JSONB.
- `report_sources`: chuẩn hóa nguồn tài liệu của report.
- `compare_results` và `compare_documents`: tách riêng module compare documents.
- `ai_request_logs`: thống kê token, chi phí và lỗi khi gọi Gemini API.
- `activity_logs`: lưu hoạt động của member trong workspace.
