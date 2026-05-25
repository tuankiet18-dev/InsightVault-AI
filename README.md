# InsightVault AI

InsightVault AI is a collaborative AI-powered knowledge workspace for project documents.

## Prerequisites

- Git
- Node.js 22+
- .NET SDK 10
- Python 3.13
- Docker Desktop

## First-Time Setup On Windows

Run from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup.ps1
```

## First-Time Setup On macOS/Linux

```bash
chmod +x scripts/*.sh
./scripts/setup.sh
```

Then open `ai-service\.env` and set:

```text
GEMINI_API_KEY=your_key_here
```

## Start Local Development On Windows

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1
```

## Start Local Development On macOS/Linux

```bash
./scripts/start-dev.sh
```

Local URLs:

- Frontend: http://localhost:5173
- Backend API: http://localhost:5126/api/health
- AI service: http://localhost:8000/health
- MinIO console: http://localhost:9001
- RabbitMQ console: http://localhost:15672

Default local infrastructure credentials are in `infra\.env.example`.

## Verify Before Commit

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check.ps1
```

On macOS/Linux:

```bash
./scripts/check.sh
```

This runs frontend lint/build, backend build, and Python import checks.

## Project Structure

- `frontend/`: React + Vite UI.
- `backend/`: ASP.NET Core Web API.
- `ai-service/`: FastAPI AI service and notebooks for AI experiments.
- `infra/`: local Docker infrastructure.
- `docs/`: project source-of-truth documents.

## Notes For Teammates

- Do not commit `.env`, `venv`, `node_modules`, `bin`, `obj`, or `dist`.
- Use notebooks only for AI experimentation under `ai-service/notebooks/`.
- Keep production AI service code in `.py` files, not notebooks.
