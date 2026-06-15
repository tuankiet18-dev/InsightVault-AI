# AI Service Completion Report

Ngay thuc hien: 2026-05-26

Update 2026-06-15: AI service still starts successfully in the Docker stack and
serves `/docs`. Backend now orchestrates document processing, compare, and
report generation through RabbitMQ-backed workers. Backend Chat/RAG APIs are
still pending, although AI service `/rag/query` is available. Runtime logs show
`google.generativeai` is deprecated; migrate to `google.genai` after the MVP
demo path is stable.

## Pham vi

Da tap trung vao phan `ai-service` theo MVP docs:

- Process document: MinIO -> extract text -> chunk -> embedding -> pgvector -> summary.
- RAG chat: query theo workspace hoặc explicit document_ids; folder mention sẽ được Backend resolve thành document_ids và trả về citations.
- Compare documents: phan tich similarities, differences, gaps, conflicts, recommendations.
- Generate Markdown report: summary/comparison/gap/section report.
- Test tu dong cho cac case chinh, khong phu thuoc Gemini API key hay PostgreSQL runtime.

Khong thuc hien:

- Khong sua frontend.
- Khong viet backend worker .NET.
- Khong thay doi schema migration.
- Khong chay E2E that voi Gemini/MinIO/PostgreSQL vi can API key va infra dang chay.

## Ke hoach da dung

1. Doc docs MVP va code AI service hien co.
2. Xac dinh gap so voi MVP: thieu persistence cho document status/summary, thieu luu report, thieu automated tests.
3. Bo sung helper DB cho document/report.
4. Cap nhat API/service layer nhung giu payload cu van dung duoc.
5. Them test unit/API bang `unittest` va FastAPI `TestClient`.
6. Chay validation va ghi lai ket qua.

## Thay doi da thuc hien

### Document processing

File lien quan:

- `ai-service/api/process.py`
- `ai-service/services/document_store.py`

Da bo sung:

- Set document status thanh `processing` khi bat dau `/process-document`.
- Neu pipeline loi, set document status thanh `failed` va ghi `processing_error`.
- Neu thanh cong, set document status thanh `completed`.
- Persist `summary`, `key_points`, `keywords`, `document_type`, `document_type_confidence`, `audience_fit`, `insights`, `processed_at`, `updated_at`.
- Response `/process-document` now includes document intelligence fields while keeping `document_id`, `chunk_count`, `summary`, `key_points`, and `keywords`.
- Target users: students, small founders, PMs and BAs working with project documents.
- Primary document types: PRD, MVP spec, business proposal, meeting note, technical doc, and project report.
- Secondary document types: CV/profile, research note, and internal knowledge docs.

### Report persistence

File lien quan:

- `ai-service/models/report.py`
- `ai-service/api/report.py`
- `ai-service/services/report_service.py`
- `ai-service/services/report_store.py`

Da bo sung:

- `GenerateReportRequest` ho tro them:
  - `folder_id`
  - `created_by_id`
  - `ai_job_id`
  - `title`
  - `store_report`
- `store_report` la legacy/optional field; MVP moi de Backend luu report/version.
- Mac dinh nen la `store_report = false`.
- Response co the co `report_id` trong legacy mode, nhung Backend khong nen phu thuoc vao AI de persist report.
- Van tuong thich payload cu vi cac field moi deu optional.

### Compare persistence

File lien quan:

- `ai-service/models/compare.py`
- `ai-service/api/compare.py`
- `ai-service/services/compare_service.py`

Da bo sung:

- `CompareRequest` ho tro them:
  - `folder_id`
  - `created_by_id`
  - `ai_job_id`
  - `title`
  - `store_report`
- `store_report` la legacy/optional field; MVP moi de Backend luu ket qua compare/report version.
- Mac dinh nen la `store_report = false`.
- Response co the co `report_id` trong legacy mode, nhung Backend khong nen phu thuoc vao AI de persist report.
- Neu Gemini khong tra `raw_markdown`, service tu tao Markdown fallback tu structured result.

### Automated tests

File moi:

- `ai-service/tests/test_ai_service.py`

Da them 9 test cases:

1. TXT extraction clean line endings va blank lines.
2. Unsupported file type bi reject.
3. Chunking ton trong overlap va metadata token range.
4. Compatibility RAG folder scope thiếu `folder_id` trả 422.
5. RAG explicit document scope thiếu `document_ids` trả 422.
6. Compare mismatch `document_ids`/`document_names` tra 422.
7. RAG khong tim thay chunks tra answer fallback va sources rong.
8. Report generation persist report va tra `report_id`.
9. Compare generation persist structured result va tra `report_id`.

## Ket qua test

The original AI-service-only pass ran the Python unit test suite before the
repository moved to Docker-only verification.

Ket qua:

```text
Ran 9 tests in 0.082s
OK
```

The original pass also ran an AST syntax/import check.

Ket qua:

```text
AST parse OK
```

Current project verification is Docker-only. Use the repository-level check:

```powershell
.\scripts\check.ps1
```

This builds the AI service container and runs the import check inside Docker.

## Rui ro con lai

- Chua chay quick E2E voi MinIO/PostgreSQL/Gemini that vi can live
  `GEMINI_API_KEY`; khi chay, start stack bang Docker Compose truoc.
- Thu vien `google.generativeai` hien can migrate sang `google.genai` ve sau; test co warning deprecation.
- Backend worker can truyen cac field optional moi (`created_by_id`, `ai_job_id`, `title`) neu muon report DB co du metadata.
- Permission/membership van do backend enforce; AI service chi filter theo IDs/scope duoc backend truyen vao.

## De xuat tiep theo

1. Chay `scripts/start-docker.ps1`, set `.env`, roi chay quick E2E trong Docker
   context; khong chay AI service bang host venv mac dinh.
2. Tich hop backend worker de doc response `report_id` va document status.
3. Sau demo MVP, migrate Gemini SDK tu `google.generativeai` sang `google.genai`.
