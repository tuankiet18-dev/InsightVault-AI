import json
import sys
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from main import app  # noqa: E402
from services.chunker import chunk_text  # noqa: E402
from services.extractor import extract  # noqa: E402
from services import compare_service, rag_service, report_service  # noqa: E402


class TextPipelineTests(unittest.TestCase):
    def test_extract_txt_cleans_extra_blank_lines(self) -> None:
        text = extract("txt", b"Alpha\r\n\r\n\r\nBeta  \n")

        self.assertEqual(text, "Alpha\n\nBeta")

    def test_extract_rejects_unsupported_file_type(self) -> None:
        with self.assertRaises(ValueError):
            extract("xlsx", b"not supported")

    def test_chunk_text_respects_overlap_and_metadata(self) -> None:
        text = " ".join(f"token-{i}" for i in range(80))
        chunks = chunk_text(text, chunk_size=30, overlap=10)

        self.assertGreater(len(chunks), 1)
        self.assertEqual(chunks[0].index, 0)
        self.assertEqual(chunks[1].metadata["token_start"], 20)
        self.assertLessEqual(chunks[0].token_count, 30)


class ApiValidationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_rag_folder_scope_requires_folder_id(self) -> None:
        response = self.client.post(
            "/rag/query",
            json={"question": "hello", "workspace_id": "w1", "scope": "folder"},
        )

        self.assertEqual(response.status_code, 422)
        self.assertIn("folder_id is required", response.text)

    def test_rag_document_scope_requires_document_ids(self) -> None:
        response = self.client.post(
            "/rag/query",
            json={"question": "hello", "workspace_id": "w1", "scope": "document"},
        )

        self.assertEqual(response.status_code, 422)
        self.assertIn("document_ids is required", response.text)

    def test_compare_rejects_mismatched_ids_and_names(self) -> None:
        response = self.client.post(
            "/compare",
            json={
                "workspace_id": "w1",
                "document_ids": ["d1", "d2"],
                "document_names": ["one.md"],
            },
        )

        self.assertEqual(response.status_code, 422)
        self.assertIn("same length", response.text)


class AiServiceUnitTests(unittest.TestCase):
    def test_rag_returns_no_source_answer_when_retrieval_empty(self) -> None:
        with (
            patch.object(rag_service, "embed_query", return_value=[0.1, 0.2]),
            patch.object(rag_service, "similarity_search", return_value=[]),
        ):
            result = rag_service.query(question="Unknown?", workspace_id="w1")

        self.assertEqual(result["sources"], [])
        self.assertIn("khong", _strip_vietnamese_accents_for_assert(result["answer"]))

    def test_report_generation_persists_report_when_enabled(self) -> None:
        fake_response = type("FakeResponse", (), {"text": "# Summary\n\nContent"})()
        with (
            patch.object(report_service, "_fetch_documents_content", return_value=[("a.md", "Alpha")]),
            patch.object(report_service.gemini_chat_model, "generate_content", return_value=fake_response),
            patch.object(report_service, "insert_report", return_value="report-1") as insert_report,
        ):
            result = report_service.generate_report(
                workspace_id="w1",
                document_ids=["d1"],
                report_type="summary_report",
                created_by_id="u1",
            )

        self.assertEqual(result["report_id"], "report-1")
        self.assertEqual(result["markdown_content"], "# Summary\n\nContent")
        insert_report.assert_called_once()

    def test_compare_generation_persists_structured_result(self) -> None:
        payload = {
            "objectives": "Align project docs",
            "scope": "MVP",
            "similarities": ["Both mention RAG"],
            "differences": ["One mentions report export"],
            "missing_information": ["Missing admin monitoring"],
            "potential_conflicts": ["Different embedding model names"],
            "recommendations": ["Update source docs"],
            "raw_markdown": "# Compare",
        }
        fake_response = type("FakeResponse", (), {"text": json.dumps(payload)})()
        with (
            patch.object(compare_service, "_get_document_content_for_compare", return_value="Doc content"),
            patch.object(compare_service.gemini_chat_model, "generate_content", return_value=fake_response),
            patch.object(compare_service, "insert_report", return_value="report-2") as insert_report,
        ):
            result = compare_service.compare_documents(
                workspace_id="w1",
                document_ids=["d1", "d2"],
                document_names=["one.md", "two.md"],
            )

        self.assertEqual(result["report_id"], "report-2")
        self.assertEqual(result["raw_markdown"], "# Compare")
        insert_report.assert_called_once()


def _strip_vietnamese_accents_for_assert(value: str) -> str:
    return (
        value.lower()
        .replace("ô", "o")
        .replace("ơ", "o")
        .replace("ì", "i")
        .replace("â", "a")
        .replace("ấ", "a")
        .replace("á", "a")
        .replace("ệ", "e")
        .replace("ệ", "e")
        .replace("ư", "u")
        .replace("ữ", "u")
    )


if __name__ == "__main__":
    unittest.main()
