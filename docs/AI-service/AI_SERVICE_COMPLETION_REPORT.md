# AI Service Completion Report

Ngay thuc hien: 2026-05-26

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
- Persist `summary`, `key_points`, `keywords`, `processed_at`, `updated_at`.
- Giu response cu: `document_id`, `chunk_count`, `summary`, `key_points`, `keywords`.

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

Lenh da chay trong `ai-service`:

```powershell
.\venv\Scripts\python.exe -m unittest discover -s tests -v
```

Ket qua:

```text
Ran 9 tests in 0.082s
OK
```

Lenh kiem tra syntax/import bang AST:

```powershell
.\venv\Scripts\python.exe -B -c "import ast,pathlib; [ast.parse(p.read_text(encoding='utf-8'), filename=str(p)) for root in ['api','core','models','services','tests'] for p in pathlib.Path(root).rglob('*.py')]; print('AST parse OK')"
```

Ket qua:

```text
AST parse OK
```

Ghi chu: `python -m compileall api core models services tests` bi fail do Windows permission tai `tests\__pycache__`, khong phai loi code. Da thay bang AST parse khong ghi bytecode.

## Rui ro con lai

- Chua chay quick E2E voi MinIO/PostgreSQL/Gemini that vi can infra va `GEMINI_API_KEY`.
- Thu vien `google.generativeai` hien can migrate sang `google.genai` ve sau; test co warning deprecation.
- Backend worker can truyen cac field optional moi (`created_by_id`, `ai_job_id`, `title`) neu muon report DB co du metadata.
- Permission/membership van do backend enforce; AI service chi filter theo IDs/scope duoc backend truyen vao.

## De xuat tiep theo

1. Chay `scripts/start-docker.ps1`, apply EF migration, set `.env`, roi chay `ai-service/scripts/quick_e2e.py`.
2. Tich hop backend worker de doc response `report_id` va document status.
3. Sau demo MVP, migrate Gemini SDK tu `google.generativeai` sang `google.genai`.
