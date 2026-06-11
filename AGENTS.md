# InsightVault AI - Agent Context

InsightVault AI is a collaborative document intelligence workspace. Treat the
codebase and docs as the raw source of truth, and keep project knowledge
distilled rather than duplicated.

## Project Shape

- `frontend/` is the React/Vite client.
- `backend/InsightVault.API/` is the .NET API, auth, workspace/document/job
  orchestration, storage integration, and EF Core migrations.
- `ai-service/` is the FastAPI service for extraction, chunking, embeddings,
  RAG, comparison, and report generation.
- `infra/docker-compose.yml` runs frontend, backend, ai-service, Postgres with
  pgvector, RabbitMQ, and MinIO.
- `docs/` stores project knowledge that should remain useful after code has
  changed.

## Knowledge Maintenance Pattern

Use the LLM Wiki pattern from `ar9av/obsidian-wiki` as the operating model:

1. Preserve raw sources: code, docs, migrations, logs, test output, and user
   reports remain authoritative.
2. Distill project knowledge into durable docs: architecture decisions,
   cross-service contracts, operational lessons, and recurring failure modes.
3. Mark uncertainty: use `^[inferred]` for reasoning not directly stated in a
   source and `^[ambiguous]` when sources disagree.
4. Prefer updating an existing doc over creating a duplicate.
5. After meaningful changes, update the relevant docs in `docs/` and summarize
   the reason, not just the file diff.

## What To Capture

Capture knowledge that would be expensive to re-derive later:

- service boundaries between backend, ai-service, database, RabbitMQ, and MinIO
- schema and migration assumptions, especially pgvector/RAG tables
- authentication, workspace permissions, and admin/user separation
- document processing lifecycle and retry behavior
- Docker startup, health checks, and local recovery commands
- frontend API contract assumptions and mock/MSW behavior

Avoid dumping file listings, generated OpenAPI output, lockfile details, or code
that is already self-explanatory.

## Local Verification

For Docker-based verification:

```powershell
docker compose -f infra\docker-compose.yml up -d --build
docker compose -f infra\docker-compose.yml ps
dotnet test backend\InsightVault.API.Tests\InsightVault.API.Tests.csproj
```

Do not use `docker compose down -v` unless the user explicitly wants to delete
local data volumes.

