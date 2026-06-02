"""
Report generation service.
Generates structured Markdown reports using Gemini.
Supports: summary_report, comparison_report, gap_analysis_report, section_report.
"""

import logging
import time
from typing import Literal

from core.config import settings
from core.database import get_connection
from core.gemini import gemini_chat_model
from services.report_store import insert_report

logger = logging.getLogger(__name__)

ReportType = Literal[
    "summary_report",
    "comparison_report",
    "gap_analysis_report",
    "gap_conflict_report",
    "folder_report",
    "section_report",
    "custom_report",
]

_REPORT_PROMPTS: dict[str, str] = {
    "summary_report": """Bạn là trợ lý tổng hợp tài liệu chuyên nghiệp.

Dựa trên nội dung các tài liệu sau, hãy tạo một báo cáo tổng hợp đầy đủ dạng Markdown.

{documents_section}

Báo cáo phải bao gồm:
1. **Tổng quan** — Giới thiệu chung về tập tài liệu
2. **Nội dung chính** — Các ý chính từ mỗi tài liệu
3. **Điểm nổi bật** — Insights quan trọng
4. **Kết luận** — Tóm tắt và đánh giá

Định dạng: Markdown chuẩn, có headings rõ ràng.""",

    "comparison_report": """Bạn là chuyên gia phân tích và so sánh tài liệu.

Dựa trên nội dung các tài liệu sau, hãy tạo báo cáo so sánh chi tiết dạng Markdown.

{documents_section}

Báo cáo phải bao gồm:
1. **Tổng quan so sánh**
2. **Điểm giống nhau**
3. **Điểm khác nhau**
4. **Thông tin thiếu sót** (gap)
5. **Mâu thuẫn tiềm năng** (nếu có)
6. **Đề xuất điều chỉnh**
7. **Kết luận**""",

    "gap_analysis_report": """Bạn là chuyên gia phân tích gap và consistency trong tài liệu.

Dựa trên nội dung các tài liệu sau, hãy tạo báo cáo phân tích gap và conflict chi tiết dạng Markdown.

{documents_section}

Báo cáo phải bao gồm:
1. **Tổng quan**
2. **Danh sách Gap** — Thông tin có ở tài liệu này nhưng thiếu ở tài liệu kia
3. **Mâu thuẫn (Conflicts)** — Các điểm mô tả khác nhau về cùng một vấn đề
4. **Phân tích nguyên nhân** — Tại sao có gap/conflict
5. **Tác động** — Ảnh hưởng của các gap/conflict
6. **Đề xuất hành động** — Cách khắc phục cụ thể
7. **Kết luận**""",

    "section_report": """Bạn là trợ lý phân tích tài liệu.

Dựa trên nội dung các tài liệu sau{custom_prompt_note}, hãy tạo báo cáo theo yêu cầu dạng Markdown.

{documents_section}

{custom_prompt_section}

Đảm bảo báo cáo có cấu trúc rõ ràng với headings và bullet points.""",
}

_REPORT_PROMPTS["gap_conflict_report"] = _REPORT_PROMPTS["gap_analysis_report"]
_REPORT_PROMPTS["folder_report"] = _REPORT_PROMPTS["summary_report"]
_REPORT_PROMPTS["custom_report"] = _REPORT_PROMPTS["section_report"]


def _fetch_documents_content(
    document_ids: list[str],
    max_chars_per_doc: int = 8000,
) -> list[tuple[str, str]]:
    """
    Fetch document names and chunk content from pgvector.
    Returns list of (document_name, content) tuples.
    """
    results = []
    with get_connection() as conn:
        cursor = conn.cursor()
        for doc_id in document_ids:
            # Get document name
            cursor.execute(
                "SELECT original_file_name FROM documents WHERE id = %s AND deleted_at IS NULL",
                (doc_id,),
            )
            row = cursor.fetchone()
            if not row:
                continue
            doc_name = row[0]

            # Get chunks content ordered by index
            cursor.execute(
                "SELECT content FROM document_chunks WHERE document_id = %s ORDER BY chunk_index",
                (doc_id,),
            )
            chunks = cursor.fetchall()
            content = "\n\n".join(r[0] for r in chunks)
            if len(content) > max_chars_per_doc:
                content = content[:max_chars_per_doc] + "\n\n[...nội dung bị giới hạn...]"

            results.append((doc_name, content or "(Không có nội dung)"))

    return results


def generate_report(
    workspace_id: str,
    document_ids: list[str],
    report_type: ReportType,
    folder_id: str | None = None,
    created_by_id: str | None = None,
    ai_job_id: str | None = None,
    title: str | None = None,
    custom_prompt: str | None = None,
    store_report: bool = False,
) -> dict:
    """
    Generate a Markdown report using Gemini.

    Args:
        workspace_id: For tracing/logging.
        document_ids: List of document UUIDs to include.
        report_type: Type of report to generate.
        custom_prompt: Optional additional instruction for section_report.

    Returns:
        dict with: report_type (str), markdown_content (str)
    """
    logger.info(
        "Generating %s for %d documents in workspace %s",
        report_type, len(document_ids), workspace_id,
    )

    docs = _fetch_documents_content(document_ids)
    if not docs:
        raise ValueError("No processable documents found for report generation.")

    documents_section = "\n\n".join(
        f"=== TÀI LIỆU: {name} ===\n{content}" for name, content in docs
    )

    prompt_template = _REPORT_PROMPTS.get(report_type, _REPORT_PROMPTS["summary_report"])

    if report_type in {"section_report", "custom_report"}:
        prompt = prompt_template.format(
            documents_section=documents_section,
            custom_prompt_note=f" theo yêu cầu: {custom_prompt}" if custom_prompt else "",
            custom_prompt_section=f"YÊU CẦU CỤ THỂ: {custom_prompt}" if custom_prompt else "",
        )
    else:
        prompt = prompt_template.format(documents_section=documents_section)

    last_error: Exception | None = None
    delay = settings.GEMINI_RETRY_DELAY

    for attempt in range(1, settings.GEMINI_MAX_RETRIES + 1):
        try:
            response = gemini_chat_model.generate_content(prompt)
            markdown_content = response.text.strip()
            report_id = None
            if store_report:
                report_id = insert_report(
                    workspace_id=workspace_id,
                    folder_id=folder_id,
                    created_by_id=created_by_id,
                    ai_job_id=ai_job_id,
                    report_type=report_type,
                    markdown_content=markdown_content,
                    source_document_ids=document_ids,
                    title=title or _default_report_title(report_type, docs),
                )
            logger.info("Report generation completed (%d chars)", len(markdown_content))
            return {
                "report_type": report_type,
                "markdown_content": markdown_content,
                "report_id": report_id,
            }
        except Exception as exc:
            last_error = exc
            logger.warning("Report Gemini call failed (attempt %d): %s", attempt, exc)
            if attempt < settings.GEMINI_MAX_RETRIES:
                time.sleep(delay)
                delay *= 2

    raise RuntimeError(
        f"Report generation failed after {settings.GEMINI_MAX_RETRIES} retries: {last_error}"
    )


def _default_report_title(report_type: str, docs: list[tuple[str, str]]) -> str:
    doc_label = docs[0][0] if len(docs) == 1 else f"{len(docs)} documents"
    return f"{report_type.replace('_', ' ').title()} - {doc_label}"
