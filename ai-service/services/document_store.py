"""Database updates for document processing results."""

import json
from datetime import UTC, datetime

from core.database import get_connection


def mark_document_processing(document_id: str) -> None:
    """Mark a document as currently being processed."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE documents
            SET status = 'processing',
                processing_error = NULL,
                updated_at = now()
            WHERE id = %s
            """,
            (document_id,),
        )


def mark_document_completed(
    document_id: str,
    summary: str,
    key_points: list[str],
    keywords: list[str],
) -> None:
    """Persist AI summary metadata and mark the document completed."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE documents
            SET status = 'completed',
                summary = %s,
                key_points = %s::jsonb,
                keywords = %s::jsonb,
                processing_error = NULL,
                processed_at = %s,
                updated_at = now()
            WHERE id = %s
            """,
            (
                summary,
                json.dumps(key_points, ensure_ascii=False),
                json.dumps(keywords, ensure_ascii=False),
                datetime.now(UTC),
                document_id,
            ),
        )


def mark_document_failed(document_id: str, error: str) -> None:
    """Mark a document failed with a concise processing error."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            """
            UPDATE documents
            SET status = 'failed',
                processing_error = %s,
                updated_at = now()
            WHERE id = %s
            """,
            (error[:4000], document_id),
        )
