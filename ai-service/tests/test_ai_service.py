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
from services import compare_service, rag_service, report_service, summarizer  # noqa: E402
from services.document_classifier import classify_document  # noqa: E402
from services.text_normalizer import normalize_for_sparse_search  # noqa: E402
from services.vector_store import _reciprocal_rank_fusion  # noqa: E402
from core.chat_provider import GroqChatProvider  # noqa: E402


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
    def test_classifier_detects_mvp_spec_for_product_scope_docs(self) -> None:
        result = classify_document(
            "The Minute MVP scope includes user flow, core features, out of scope mobile tracking, and AI role.",
            "THE MINUTE.md",
        )

        self.assertEqual(result.document_type, "mvp_spec")
        self.assertEqual(result.audience_fit, "students_founders_pm_ba")
        self.assertGreaterEqual(result.confidence, 0.45)

    def test_summarizer_returns_new_document_intelligence_schema(self) -> None:
        payload = {
            "document_type": "mvp_spec",
            "document_type_confidence": 0.88,
            "audience_fit": "students_founders_pm_ba",
            "summary": "The Minute is an MVP spec for a map-based memory journaling web app.",
            "key_points": ["Core MVP: Map, memory nodes, and timeline are central."],
            "insights": {
                "scope": ["Web MVP focuses on manual memory capture."],
                "decisions": ["Keep background tracking out of MVP."],
                "risks": ["Users may not maintain journaling habits."],
                "gaps": ["AI effectiveness needs validation."],
                "next_actions": ["Define acceptance criteria for memory node creation."],
            },
            "keywords": ["mvp", "memory", "journaling"],
        }

        with patch.object(summarizer.chat_model, "generate_text", return_value=json.dumps(payload)):
            result = summarizer.generate_summary(
                "MVP scope, user flow, core features, out of scope, AI role",
                "THE MINUTE.md",
            )

        self.assertEqual(result["document_type"], "mvp_spec")
        self.assertEqual(result["document_type_confidence"], 0.88)
        self.assertEqual(result["insights"]["next_actions"], payload["insights"]["next_actions"])
        self.assertEqual(result["keywords"], ["mvp", "memory", "journaling"])

    def test_groq_provider_uses_openai_compatible_chat_completion(self) -> None:
        fake_response = type(
            "FakeResponse",
            (),
            {
                "raise_for_status": lambda self: None,
                "json": lambda self: {
                    "choices": [{"message": {"content": " Answer from Groq "}}]
                },
            },
        )()

        with (
            patch("core.chat_provider.settings.GROQ_API_KEY", "test-key"),
            patch("core.chat_provider.httpx.post", return_value=fake_response) as post,
        ):
            result = GroqChatProvider("llama-test").generate_text("hello")

        self.assertEqual(result, "Answer from Groq")
        post.assert_called_once()
        request = post.call_args.kwargs
        self.assertEqual(request["json"]["model"], "llama-test")
        self.assertEqual(request["json"]["messages"][0]["content"], "hello")

    def test_rag_returns_no_source_answer_when_retrieval_empty(self) -> None:
        with (
            patch.object(rag_service, "embed_query", return_value=[0.1, 0.2]),
            patch.object(rag_service, "hybrid_search", return_value=[]),
        ):
            result = rag_service.query(question="Unknown?", workspace_id="w1")

        self.assertEqual(result["sources"], [])
        self.assertIn("khong", _strip_vietnamese_accents_for_assert(result["answer"]))

    def test_normalize_for_sparse_search_preserves_technical_tokens(self) -> None:
        normalized = normalize_for_sparse_search(
            "Tài liệu nói về JWT, ERR-401 và AI_ALLOW_REPORT_PERSISTENCE=false."
        )

        self.assertIn("tai lieu", normalized)
        self.assertIn("jwt", normalized)
        self.assertIn("err-401", normalized)
        self.assertIn("ai_allow_report_persistence", normalized)

    def test_rrf_deduplicates_and_keeps_debug_scores(self) -> None:
        dense = [
            {
                "chunk_id": "c1",
                "document_id": "d1",
                "file_name": "a.md",
                "chunk_index": 0,
                "content": "Alpha",
                "similarity": 0.9,
                "dense_score": 0.9,
                "metadata": {},
            },
            {
                "chunk_id": "c2",
                "document_id": "d1",
                "file_name": "a.md",
                "chunk_index": 1,
                "content": "Beta",
                "similarity": 0.8,
                "dense_score": 0.8,
                "metadata": {},
            },
        ]
        sparse = [
            {
                "chunk_id": "c2",
                "document_id": "d1",
                "file_name": "a.md",
                "chunk_index": 1,
                "content": "Beta",
                "similarity": None,
                "sparse_original_score": 1.5,
                "metadata": {},
            }
        ]

        fused = _reciprocal_rank_fusion(
            [("dense", dense), ("sparse_original", sparse)]
        )

        self.assertEqual(fused[0]["chunk_id"], "c2")
        self.assertEqual(len(fused), 2)
        self.assertEqual(fused[0]["retrieval_debug"]["dense_rank"], 2)
        self.assertEqual(fused[0]["retrieval_debug"]["sparse_original_rank"], 1)
        self.assertEqual(fused[0]["retrieval_debug"]["sparse_original_score"], 1.5)

    def test_report_generation_persists_report_when_enabled(self) -> None:
        with (
            patch.object(report_service, "_fetch_documents_content", return_value=[("a.md", "Alpha")]),
            patch.object(report_service.chat_model, "generate_text", return_value="# Summary\n\nContent"),
            patch.object(report_service, "insert_report", return_value="report-1") as insert_report,
        ):
            result = report_service.generate_report(
                workspace_id="w1",
                document_ids=["d1"],
                report_type="summary_report",
                created_by_id="u1",
                store_report=True,
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
        with (
            patch.object(compare_service, "_get_document_content_for_compare", return_value="Doc content"),
            patch.object(compare_service.chat_model, "generate_text", return_value=json.dumps(payload)),
            patch.object(compare_service, "insert_report", return_value="report-2") as insert_report,
        ):
            result = compare_service.compare_documents(
                workspace_id="w1",
                document_ids=["d1", "d2"],
                document_names=["one.md", "two.md"],
                store_report=True,
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
