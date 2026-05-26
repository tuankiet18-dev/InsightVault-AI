"""
Vector store operations for pgvector.
Handles insert, similarity search, and deletion of document chunks.
"""

import json
import logging
from typing import Any
from uuid import UUID

import numpy as np

from core.config import settings
from core.database import get_connection

logger = logging.getLogger(__name__)


def insert_chunks(
    document_id: str,
    workspace_id: str,
    folder_id: str | None,
    chunks_content: list[str],
    embeddings: list[list[float]],
    token_counts: list[int],
    metadata_list: list[dict[str, Any]],
) -> int:
    """
    Insert document chunks and their embeddings into pgvector.

    Returns:
        Number of chunks inserted.
    """
    assert len(chunks_content) == len(embeddings) == len(token_counts), (
        "chunks, embeddings, token_counts must have the same length"
    )

    with get_connection() as conn:
        cursor = conn.cursor()
        inserted = 0
        for i, (content, embedding, token_count, metadata) in enumerate(
            zip(chunks_content, embeddings, token_counts, metadata_list)
        ):
            cursor.execute(
                """
                INSERT INTO document_chunks
                    (document_id, workspace_id, folder_id, chunk_index,
                     content, token_count, embedding, embedding_model, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (document_id, chunk_index) DO UPDATE
                    SET content = EXCLUDED.content,
                        token_count = EXCLUDED.token_count,
                        embedding = EXCLUDED.embedding,
                        embedding_model = EXCLUDED.embedding_model,
                        metadata = EXCLUDED.metadata
                """,
                (
                    document_id,
                    workspace_id,
                    folder_id,
                    i,
                    content,
                    token_count,
                    np.array(embedding, dtype=np.float32),
                    settings.GEMINI_EMBEDDING_MODEL,
                    json.dumps(metadata),
                ),
            )
            inserted += 1

        logger.info(
            "Inserted %d chunks for document %s into pgvector", inserted, document_id
        )
        return inserted


def similarity_search(
    query_vector: list[float],
    workspace_id: str,
    folder_id: str | None = None,
    document_ids: list[str] | None = None,
    top_k: int = settings.RAG_TOP_K,
    threshold: float = settings.RAG_SIMILARITY_THRESHOLD,
) -> list[dict[str, Any]]:
    """
    Retrieve top-k most similar chunks using cosine similarity.

    Scope priority:
        - document_ids: search within specific documents
        - folder_id: search within a folder
        - workspace_id: search across entire workspace

    Returns list of dicts with: chunk_id, document_id, content, similarity, metadata.
    """
    vector = np.array(query_vector, dtype=np.float32)

    with get_connection() as conn:
        cursor = conn.cursor()

        # Build dynamic WHERE clause based on scope
        conditions = ["dc.workspace_id = %s"]
        params: list[Any] = [workspace_id]

        if document_ids:
            placeholders = ", ".join(["%s"] * len(document_ids))
            conditions.append(f"dc.document_id IN ({placeholders})")
            params.extend(document_ids)
        elif folder_id:
            conditions.append("dc.folder_id = %s")
            params.append(folder_id)

        where_clause = " AND ".join(conditions)

        # cosine similarity = 1 - cosine_distance
        # pgvector operator <=> is cosine distance
        cursor.execute(
            f"""
            SELECT
                dc.id                              AS chunk_id,
                dc.document_id,
                d.original_file_name               AS file_name,
                dc.chunk_index,
                dc.content,
                dc.metadata,
                1 - (dc.embedding <=> %s::vector)  AS similarity
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            WHERE {where_clause}
              AND d.deleted_at IS NULL
              AND 1 - (dc.embedding <=> %s::vector) >= %s
            ORDER BY dc.embedding <=> %s::vector
            LIMIT %s
            """,
            [vector, *params, vector, threshold, vector, top_k],
        )

        rows = cursor.fetchall()
        results = []
        for row in rows:
            chunk_id, document_id, file_name, chunk_index, content, metadata, similarity = row
            results.append(
                {
                    "chunk_id": str(chunk_id),
                    "document_id": str(document_id),
                    "file_name": file_name,
                    "chunk_index": chunk_index,
                    "content": content,
                    "similarity": round(float(similarity), 4),
                    "metadata": metadata if isinstance(metadata, dict) else json.loads(metadata or "{}"),
                }
            )

        logger.info(
            "Similarity search returned %d chunks (workspace=%s)", len(results), workspace_id
        )
        return results


def delete_chunks_by_document(document_id: str) -> int:
    """Delete all chunks for a document. Returns number of rows deleted."""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(
            "DELETE FROM document_chunks WHERE document_id = %s",
            (document_id,),
        )
        deleted = cursor.rowcount
        logger.info("Deleted %d chunks for document %s", deleted, document_id)
        return deleted
