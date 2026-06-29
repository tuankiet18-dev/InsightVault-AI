# InsightVault AI

**InsightVault AI** is a collaborative document intelligence workspace designed for teams, researchers, and professionals. It transforms shared project documents into an accessible, searchable knowledge system powered by AI. 

Upload documents, check processing status, read summaries, compare files, and generate comprehensive reports—all within a unified, professional IDE-like environment that respects permissions and source traceability.

## 🌟 Features

- **Collaborative Workspaces**: Organize documents into shared workspaces with role-based access control.
- **AI-Powered Insights**: Summarize, compare, and interrogate documents using advanced LLMs (integrated with Gemini).
- **RAG & Semantic Search**: Instantly retrieve context-aware answers grounded in your uploaded documents.
- **Automated Report Generation**: Synthesize multiple sources into cohesive, actionable reports.
- **Enterprise-grade Storage & Message Queuing**: Scalable architecture using MinIO for object storage and RabbitMQ for job orchestration.

## 🛠 Tech Stack

InsightVault AI is built as a cohesive full-stack application running entirely inside Docker:

- **Frontend**: React 19 + Vite, Tailwind CSS v4, Radix UI primitives.
- **Backend**: ASP.NET Core (REST API, Workspace orchestration, Job management).
- **AI Service**: FastAPI (Extraction, chunking, embeddings, RAG, comparison).
- **Infrastructure**: PostgreSQL (with pgvector), RabbitMQ, MinIO.

## 🚀 Quick Start

> **Docker-Only Rule**: All normal setup, development, and verification runs through Docker. Node.js, .NET SDK, and Python are not required on your host machine.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Git

### 1. Environment Setup

Copy the example environment files to configure your local setup:

```powershell
# Windows
Copy-Item infra\.env.example infra\.env
Copy-Item ai-service\.env.example ai-service\.env

# macOS / Linux
cp infra/.env.example infra/.env
cp ai-service/.env.example ai-service/.env
```

Ensure `infra\.env` has values for `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`, `RABBITMQ_DEFAULT_PASS`, `JWT_SIGNING_KEY`, and `GOOGLE_CLIENT_ID`. 
To enable AI features (RAG, summaries, embeddings), add your `GEMINI_API_KEY` to `ai-service\.env`.

### 2. Build and Start

Run the setup script to build and validate the Docker stack:

```powershell
# Windows
.\scripts\setup.ps1
.\scripts\start-docker.ps1

# macOS / Linux
./scripts/setup.sh
./scripts/start-docker.sh
```

For subsequent runs without rebuilding images, use `start-docker-fast`.

### 3. Access the Services

Once the stack is running, access the local endpoints:

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5126](http://localhost:5126)
- **Backend OpenAPI Docs**: [http://localhost:5126/openapi/v1.json](http://localhost:5126/openapi/v1.json)
- **AI Service Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **MinIO Console**: [http://localhost:9001](http://localhost:9001)
- **RabbitMQ Management**: [http://localhost:15672](http://localhost:15672)

## 🧪 Verification & Testing

To run the full suite of health checks, backend tests, and frontend linters inside their respective containers:

```powershell
# Windows
.\scripts\check.ps1

# macOS / Linux
./scripts/check.sh
```

To quickly verify health endpoints of a running stack:

```powershell
.\scripts\backend-smoke.ps1
```

## 🧹 Maintenance

To clean generated build and test artifacts without deleting Docker volumes or your environment files:

```powershell
# Windows
.\scripts\clean.ps1

# macOS / Linux
./scripts/clean.sh
```
*(Warning: Only run `docker compose down -v` if you intend to permanently delete your local database and storage volumes.)*

## 📖 Documentation

Detailed project architecture and design notes can be found in the `docs/` directory.

- Current project status: `docs/about-project/CURRENT_PROJECT_STATUS.md`
- Design system: `DESIGN.md`
- Product definitions: `PRODUCT.md`
- Agent rules & conventions: `AGENTS.md`
