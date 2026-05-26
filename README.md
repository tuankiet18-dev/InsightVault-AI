# InsightVault AI (Lotus Bridge)

InsightVault AI là hệ thống quản lý và phân tích tài liệu thông minh tích hợp trí tuệ nhân tạo. Dự án bao gồm các thành phần:

- **Frontend**: React, Vite, TypeScript
- **Backend**: ASP.NET Core 10 Web API
- **AI Service**: Python 3, FastAPI, Gemini API
- **Infrastructure**: PostgreSQL (pgvector), MinIO (chạy qua Docker)

## 📌 Yêu cầu hệ thống (Prerequisites)

Để chạy dự án trên máy local, bạn cần cài đặt:
1. **Docker Desktop** (bắt buộc phải bật Docker Desktop trước khi chạy)
2. **Node.js** (v18+ cho Frontend)
3. **.NET 10 SDK** (cho Backend)
4. **Python 3.10+** (cho AI Service)
5. **Git**

## 🚀 Hướng dẫn chạy dự án (Local Development)

### Bước 1: Khởi động Infrastructure (Database & Storage)

Mở terminal (PowerShell) tại thư mục `insightvault-ai` và chạy:

```powershell
cd insightvault-ai
.\scripts\start-docker.ps1
```
*Script này sẽ tự động khởi chạy PostgreSQL (có pgvector) và MinIO thông qua Docker Compose.*

- **MinIO Console**: `http://localhost:9001` (admin / password123)
- **PostgreSQL**: `localhost:5432` (admin / password123 / DB: insightvault)

### Bước 2: Chạy Backend (.NET Core)

Mở một terminal mới:

```powershell
cd insightvault-ai\backend\InsightVault.API
dotnet run
```
*Backend Swagger UI sẽ có sẵn tại: `http://localhost:5000/swagger` (hoặc cổng cấu hình trong `launchSettings.json`).*

### Bước 3: Chạy AI Service (Python FastAPI)

Mở một terminal mới:

```powershell
cd insightvault-ai\ai-service

# 1. Tạo môi trường ảo (chỉ làm lần đầu)
python -m venv venv

# 2. Kích hoạt môi trường ảo
.\venv\Scripts\activate

# 3. Cài đặt dependencies (chỉ làm lần đầu hoặc khi có thay đổi)
pip install -r requirements.txt

# 4. Copy file cấu hình môi trường
cp .env.example .env

# 5. Cấu hình Gemini API Key
# Mở file .env và điền GEMINI_API_KEY của bạn vào

# 6. Khởi chạy AI Service
python main.py
```
*AI Service Docs (Swagger) sẽ có sẵn tại: `http://127.0.0.1:8000/docs`.*

### Bước 4: Chạy Frontend (React/Vite)

Mở một terminal mới:

```powershell
cd insightvault-ai\frontend

# 1. Cài đặt dependencies (chỉ làm lần đầu)
npm install

# 2. Khởi chạy giao diện
npm run dev
```
*Frontend sẽ chạy tại: `http://localhost:5173`.*

---

## 🛠 Hướng dẫn làm việc (Workflow cho Teammate)

### 1. Kiểm tra code trước khi commit (Pre-commit check)
Dự án có sẵn script để tự động format, lint và build thử nghiệm để đảm bảo code của bạn không gây lỗi CI/CD.
Trước khi `git commit` hoặc tạo Pull Request, hãy luôn chạy:

```powershell
cd insightvault-ai
.\scripts\check.ps1
```

### 2. Quản lý AI Service Models
Trong `ai-service/.env`, project đang dùng:
- Embedding: `gemini-embedding-001`
- Chat/Report: `gemini-2.5-flash`

*Lưu ý: Nếu bạn gặp lỗi 429 Quota Exceeded khi test AI Service, nguyên nhân là do Free Tier của Gemini API Key bị giới hạn số lượng request. Hãy thay API Key khác hoặc đợi để test tiếp.*

### 3. Tài liệu thiết kế
Các tài liệu quan trọng của dự án (ERD, Architecture, Kế hoạch MVP) được lưu trữ trong thư mục `docs/`. Hãy đọc các tài liệu này nếu bạn làm việc với database schema hoặc system architecture.
