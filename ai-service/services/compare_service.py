"""
Document comparison service.
Compares 2+ documents and detects gaps, conflicts, and differences.
"""

import json
import logging
import time

from core.config import settings
from core.database import get_connection
from core.gemini import gemini_chat_model
from services.report_store import insert_report

logger = logging.getLogger(__name__)

_COMPARE_PROMPT = """Bạn là chuyên gia phân tích tài liệu kỹ thuật.

Hãy so sánh các tài liệu sau và trả về kết quả theo định dạng JSON chính xác.

{documents_section}

NHIỆM VỤ: Phân tích và so sánh toàn diện các tài liệu trên.

Trả về JSON với cấu trúc sau (KHÔNG có text ngoài JSON):
{{
  "objectives": "Mục tiêu/mục đích của các tài liệu này",
  "scope": "Phạm vi và quy mô được đề cập",
  "similarities": [
    "Điểm giống nhau 1",
    "Điểm giống nhau 2"
  ],
  "differences": [
    "Điểm khác nhau 1",
    "Điểm khác nhau 2"
  ],
  "missing_information": [
    "Thông tin có trong tài liệu A nhưng không có trong tài liệu B",
    "Gap hoặc thiếu sót quan trọng"
  ],
  "potential_conflicts": [
    "Mâu thuẫn tiềm năng giữa các tài liệu"
  ],
  "recommendations": [
    "Đề xuất cải thiện 1",
    "Đề xuất cải thiện 2"
  ],
  "raw_markdown": "# So Sánh Tài Liệu\\n\\n## Điểm Giống Nhau\\n..."
}}"""


def _get_document_content_for_compare(document_id: str, max_chars: int = 8000) -> str:
    """Fetch top chunks content for a document from the DB for comparison."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT content FROM document_chunks
            WHERE document_id = %s
            ORDER BY chunk_index
            """,
            (document_id,),
        )
        rows = cursor.fetchall()

    full_text = "\n\n".join(row[0] for row in rows)
    if len(full_text) > max_chars:
        full_text = full_text[:max_chars] + "\n\n[...nội dung tiếp theo...]"
    return full_text


def compare_documents(
    workspace_id: str,
    document_ids: list[str],
    document_names: list[str],
    folder_id: str | None = None,
    created_by_id: str | None = None,
    ai_job_id: str | None = None,
    title: str | None = None,
    store_report: bool = True,
) -> dict:
    """
    Compare multiple documents and detect gaps/conflicts.

    Args:
        workspace_id: For permission context (not queried here but kept for tracing).
        document_ids: List of document UUIDs to compare.
        document_names: Corresponding display names.

    Returns:
        dict with: objectives, scope, similarities, differences,
                   missing_information, potential_conflicts, recommendations, raw_markdown
    """
    logger.info("Comparing %d documents: %s", len(document_ids), document_ids)

    # Fetch content for each document
    documents_section_parts = []
    for doc_id, doc_name in zip(document_ids, document_names):
        content = _get_document_content_for_compare(doc_id)
        if not content:
            content = "(Không có nội dung — tài liệu chưa được xử lý)"
        documents_section_parts.append(
            f"=== TÀI LIỆU: {doc_name} ===\n{content}"
        )

    documents_section = "\n\n".join(documents_section_parts)
    prompt = _COMPARE_PROMPT.format(documents_section=documents_section)

    last_error: Exception | None = None
    delay = settings.GEMINI_RETRY_DELAY

    for attempt in range(1, settings.GEMINI_MAX_RETRIES + 1):
        try:
            response = gemini_chat_model.generate_content(prompt)
            raw = response.text.strip()

            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]

            result = json.loads(raw)
            report_id = None
            raw_markdown = result.get("raw_markdown", "")
            if store_report:
                report_id = insert_report(
                    workspace_id=workspace_id,
                    folder_id=folder_id,
                    created_by_id=created_by_id,
                    ai_job_id=ai_job_id,
                    report_type="comparison_report",
                    markdown_content=raw_markdown or _markdown_from_compare_result(result),
                    source_document_ids=document_ids,
                    title=title or f"Comparison Report - {len(document_ids)} documents",
                    structured_result=result,
                )
            logger.info("Document comparison completed successfully")
            return {
                "objectives": result.get("objectives", ""),
                "scope": result.get("scope", ""),
                "similarities": result.get("similarities", []),
                "differences": result.get("differences", []),
                "missing_information": result.get("missing_information", []),
                "potential_conflicts": result.get("potential_conflicts", []),
                "recommendations": result.get("recommendations", []),
                "raw_markdown": raw_markdown,
                "report_id": report_id,
            }

        except json.JSONDecodeError as exc:
            last_error = exc
            logger.warning("Compare JSON parse failed (attempt %d): %s", attempt, exc)
        except Exception as exc:
            last_error = exc
            logger.warning("Compare Gemini call failed (attempt %d): %s", attempt, exc)

        if attempt < settings.GEMINI_MAX_RETRIES:
            time.sleep(delay)
            delay *= 2

    raise RuntimeError(
        f"Document comparison failed after {settings.GEMINI_MAX_RETRIES} retries: {last_error}"
    )


def _markdown_from_compare_result(result: dict) -> str:
    sections = [
        "# Document Comparison",
        "## Objectives",
        str(result.get("objectives", "")),
        "## Scope",
        str(result.get("scope", "")),
    ]
    for key, title in [
        ("similarities", "Similarities"),
        ("differences", "Differences"),
        ("missing_information", "Missing Information"),
        ("potential_conflicts", "Potential Conflicts"),
        ("recommendations", "Recommendations"),
    ]:
        values = result.get(key, [])
        sections.append(f"## {title}")
        sections.extend(f"- {value}" for value in values)
    return "\n\n".join(sections)
