"""Persistence helpers for generated AI reports."""

import json
from typing import Any

from core.chat_provider import get_chat_model_name
from core.database import get_connection


def insert_report(
    workspace_id: str,
    report_type: str,
    markdown_content: str,
    source_document_ids: list[str],
    title: str,
    folder_id: str | None = None,
    created_by_id: str | None = None,
    ai_job_id: str | None = None,
    structured_result: dict[str, Any] | None = None,
) -> str:
    """Insert a generated report and return its UUID."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO reports
                (workspace_id, folder_id, created_by_id, ai_job_id, title,
                 report_type, markdown_content, source_documents,
                 structured_result, model_name)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s)
            RETURNING id
            """,
            (
                workspace_id,
                folder_id,
                created_by_id,
                ai_job_id,
                title,
                report_type,
                markdown_content,
                json.dumps(source_document_ids),
                json.dumps(structured_result or {}, ensure_ascii=False),
                get_chat_model_name(),
            ),
        )
        report_id = cursor.fetchone()[0]
        return str(report_id)
