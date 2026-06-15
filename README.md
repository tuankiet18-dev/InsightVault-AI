# InsightVault AI

InsightVault AI is a collaborative document intelligence workspace. The app is
run as one Docker Compose stack: React/Vite frontend, ASP.NET Core backend,
FastAPI AI service, PostgreSQL with pgvector, RabbitMQ, and MinIO.

Current project status is tracked in
`docs/about-project/CURRENT_PROJECT_STATUS.md`.

## Docker-Only Rule

All normal setup, development, verification, and smoke testing must run through
Docker. Do not run the frontend, backend, or AI service as separate local
processes unless a maintainer explicitly asks for a one-off debugging session.

Required local tooling:

- Docker Desktop
- Git

Node.js, .NET SDK, and Python are not required on the host for the standard
workflow. They are installed inside the project containers.

## Environment Files

Create local env files if they do not exist:

```powershell
Copy-Item infra\.env.example infra\.env
Copy-Item ai-service\.env.example ai-service\.env
```

For local development, `infra\.env` must include non-empty values for:

- `POSTGRES_PASSWORD`
- `MINIO_ROOT_PASSWORD`
- `RABBITMQ_DEFAULT_PASS`
- `JWT_SIGNING_KEY`
- `GOOGLE_CLIENT_ID`

Optional integrations can stay disabled until credentials are available:

- `SMTP_ENABLED=false`
- `PAYOS_ENABLED=false`

The AI service needs `GEMINI_API_KEY` in `ai-service\.env` before live document
processing, embeddings, RAG, compare, or report generation can call Gemini.

## Setup

Build and validate the Docker stack:

```powershell
.\scripts\setup.ps1
```

Bash equivalent:

```bash
./scripts/setup.sh
```

## Start

Fast start without rebuilding images:

```powershell
.\scripts\start-docker-fast.ps1
```

Start and rebuild:

```powershell
.\scripts\start-docker.ps1
```

Bash equivalent:

```bash
./scripts/start-docker.sh
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5126`
- Backend OpenAPI: `http://localhost:5126/openapi/v1.json`
- AI service docs: `http://localhost:8000/docs`
- MinIO console: `http://localhost:9001`
- RabbitMQ management: `http://localhost:15672`

## Verify

Run Docker-based checks:

```powershell
.\scripts\check.ps1
```

This validates Compose config, builds images, runs frontend lint/build inside
the frontend container, runs backend tests inside a .NET SDK container, checks
AI service imports inside the AI container, starts the stack, and runs health
smoke checks.

For a quick health-only pass against an already running stack:

```powershell
.\scripts\backend-smoke.ps1
```

## Clean

Remove generated build/test artifacts without deleting Docker volumes or env
files:

```powershell
.\scripts\clean.ps1
```

Use Docker volume deletion only when you intentionally want to reset local data.
Do not run `docker compose down -v` casually.
