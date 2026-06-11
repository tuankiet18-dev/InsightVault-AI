# LLM Wiki Adoption Plan for InsightVault AI

This note adapts the `ar9av/obsidian-wiki` skill framework to InsightVault AI.
The goal is not to vendor the repo into this project. The useful part is the
operating model: compile project knowledge once, keep it current, and make
future agents query distilled context before rediscovering it from scratch.

## Source

- Repository reviewed: https://github.com/ar9av/obsidian-wiki
- Relevant skills: `llm-wiki`, `wiki-update`, `wiki-ingest`, `wiki-query`,
  `wiki-status`, `wiki-lint`, `cross-linker`, `tag-taxonomy`
- Core pattern: raw sources -> compiled wiki/docs -> schema and maintenance
  rules

## What Maps To InsightVault

### Raw Sources

For this project, raw sources are:

- application code in `frontend/`, `backend/InsightVault.API/`, and
  `ai-service/`
- EF Core migrations and Postgres schema
- Docker Compose infrastructure
- API contracts and OpenAPI output
- user-reported bugs and terminal logs
- existing documentation in `docs/`

These should remain authoritative. Do not rewrite raw history into summaries.

### Compiled Project Knowledge

InsightVault should keep durable project knowledge under `docs/`, especially:

- `docs/backend/` for API, schema, job, auth, and permission rules
- `docs/AI-service/` for RAG, extraction, embedding, comparison, and report
  behavior
- `docs/frontend-docs/` for UI flows, API assumptions, and mock/MSW behavior
- `docs/about-project/` for cross-service architecture, decisions, and project
  memory

Docs should explain why the system behaves a certain way, not just what files
exist.

### Schema And Trust

Adopt these lightweight conventions in project docs:

- `summary:` frontmatter is recommended for long-lived knowledge pages.
- `sources:` should point to code paths, docs, migration IDs, issue reports, or
  user sessions that justify the page.
- `^[inferred]` marks reasoning not directly stated in sources.
- `^[ambiguous]` marks disagreement or uncertainty.
- Prefer updating an existing doc over adding a near-duplicate.

Example:

```markdown
---
title: Document Processing Lifecycle
category: backend
tags: [documents, rabbitmq, ai-service, pgvector]
sources:
  - backend/InsightVault.API/Infrastructure/BackgroundJobs/DocumentProcessingWorker.cs
  - ai-service/services/vector_store.py
summary: Backend queues document jobs through RabbitMQ; ai-service extracts,
  chunks, embeds, and writes pgvector rows before backend marks completion.
---
```

## Product Ideas For InsightVault

The Obsidian Wiki pattern also suggests product features that fit InsightVault:

1. Delta-aware document processing
   - Track content hash per uploaded document.
   - Skip reprocessing when file content is unchanged.
   - Re-run only affected chunks when possible.

2. Knowledge provenance
   - Store claim-level or section-level provenance for summaries and reports.
   - Distinguish extracted facts from inferred synthesis.
   - Surface ambiguous claims in report output.

3. Workspace knowledge graph
   - Treat documents, chunks, reports, chat answers, and folders as graph nodes.
   - Add typed edges such as `uses`, `contradicts`, `derived_from`,
     `summarizes`, and `cites`.
   - Use graph structure for "how are these documents connected?" queries.

4. Workspace hot cache
   - Maintain a small workspace-level semantic snapshot of recent uploads,
     active questions, failed jobs, and key takeaways.
   - Use it to speed up chat context and dashboard summaries.

5. Wiki-style health checks
   - Show orphan documents, stale summaries, failed processing jobs, duplicate
     filenames, and missing provenance.
   - Recommend retry, reprocess, merge, or archive actions.

## Recommended Implementation Phases

### Phase 1 - Project Operating Model

- Add project-level agent context in `AGENTS.md`.
- Keep docs updated after meaningful backend, frontend, ai-service, or infra
  changes.
- Record operational lessons, such as schema drift causing AI processing
  failures.

### Phase 2 - Metadata And Provenance

- Extend `documents`, `document_chunks`, `reports`, and generated answers with
  provenance metadata.
- Record source document IDs, chunk IDs, extraction type, confidence, and
  ambiguity markers where useful.
- Add tests around schema compatibility between backend migrations and
  ai-service SQL.

### Phase 3 - Workspace Graph

- Add typed relationship metadata between documents, chunks, reports, and chat
  sources.
- Expose graph-oriented endpoints for workspace insight views.
- Add UI for hubs, isolated documents, contradictions, and related clusters.

### Phase 4 - Delta Processing

- Store stable content hashes for documents and chunks.
- Make retries idempotent.
- Avoid duplicate work when a document is uploaded again unchanged.

## Immediate Rules For Future Agents

- Before major edits, read the relevant docs and code path.
- After fixing a non-obvious bug, update or create a short doc entry that
  captures the root cause and prevention.
- If a migration and service SQL diverge, fix both the live schema recovery path
  and the startup/migration process.
- Keep generated files and unrelated dirty work separate from intentional
  changes.

