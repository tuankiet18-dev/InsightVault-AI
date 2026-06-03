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
from services.text_normalizer import normalize_for_sparse_search

logger = logging.getLogger(__name__)
_RRF_K = 60


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
                     content, normalized_content, token_count, embedding, embedding_model, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (document_id, chunk_index) DO UPDATE
                    SET content = EXCLUDED.content,
                        normalized_content = EXCLUDED.normalized_content,
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
                    normalize_for_sparse_search(content),
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


def dense_search(
    query_vector: list[float],
    workspace_id: str,
    folder_id: str | None = None,
    document_ids: list[str] | None = None,
    top_k: int = settings.RAG_DENSE_TOP_K,
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
                    "dense_score": round(float(similarity), 4),
                    "metadata": metadata if isinstance(metadata, dict) else json.loads(metadata or "{}"),
                }
            )

        logger.info(
            "Dense search returned %d chunks (workspace=%s)", len(results), workspace_id
        )
        return results


def sparse_search(
    query_text: str,
    workspace_id: str,
    folder_id: str | None = None,
    document_ids: list[str] | None = None,
    top_k: int = settings.RAG_SPARSE_TOP_K,
    normalized: bool = False,
) -> list[dict[str, Any]]:
    """
    Retrieve chunks with PostgreSQL full-text search.

    Runs against either original content or normalized accent-insensitive content.
    """
    search_text = normalize_for_sparse_search(query_text) if normalized else query_text.strip()
    if not search_text:
        return []

    search_column = "dc.normalized_content" if normalized else "dc.content"
    score_key = "sparse_normalized_score" if normalized else "sparse_original_score"

    with get_connection() as conn:
        cursor = conn.cursor()
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
        cursor.execute(
            f"""
            WITH query AS (
                SELECT websearch_to_tsquery('simple', %s) AS tsq
            )
            SELECT
                dc.id AS chunk_id,
                dc.document_id,
                d.original_file_name AS file_name,
                dc.chunk_index,
                dc.content,
                dc.metadata,
                ts_rank_cd(to_tsvector('simple', {search_column}), query.tsq) AS sparse_score
            FROM document_chunks dc
            JOIN documents d ON d.id = dc.document_id
            CROSS JOIN query
            WHERE {where_clause}
              AND d.deleted_at IS NULL
              AND to_tsvector('simple', {search_column}) @@ query.tsq
            ORDER BY sparse_score DESC
            LIMIT %s
            """,
            [search_text, *params, top_k],
        )

        rows = cursor.fetchall()
        results = []
        for row in rows:
            chunk_id, document_id, file_name, chunk_index, content, metadata, sparse_score = row
            score = round(float(sparse_score), 4)
            results.append(
                {
                    "chunk_id": str(chunk_id),
                    "document_id": str(document_id),
                    "file_name": file_name,
                    "chunk_index": chunk_index,
                    "content": content,
                    "similarity": None,
                    score_key: score,
                    "metadata": metadata if isinstance(metadata, dict) else json.loads(metadata or "{}"),
                }
            )

        logger.info(
            "%s sparse search returned %d chunks (workspace=%s)",
            "Normalized" if normalized else "Original",
            len(results),
            workspace_id,
        )
        return results


def hybrid_search(
    query_text: str,
    query_vector: list[float],
    workspace_id: str,
    folder_id: str | None = None,
    document_ids: list[str] | None = None,
    top_k: int = settings.RAG_TOP_K,
) -> list[dict[str, Any]]:
    """Run dense + sparse retrieval and fuse ranks with Reciprocal Rank Fusion."""
    dense_results = dense_search(
        query_vector=query_vector,
        workspace_id=workspace_id,
        folder_id=folder_id,
        document_ids=document_ids,
        top_k=settings.RAG_DENSE_TOP_K,
    )
    sparse_original_results = sparse_search(
        query_text=query_text,
        workspace_id=workspace_id,
        folder_id=folder_id,
        document_ids=document_ids,
        top_k=settings.RAG_SPARSE_TOP_K,
        normalized=False,
    )
    sparse_normalized_results = sparse_search(
        query_text=query_text,
        workspace_id=workspace_id,
        folder_id=folder_id,
        document_ids=document_ids,
        top_k=settings.RAG_SPARSE_TOP_K,
        normalized=True,
    )

    fused = _reciprocal_rank_fusion(
        [
            ("dense", dense_results),
            ("sparse_original", sparse_original_results),
            ("sparse_normalized", sparse_normalized_results),
        ]
    )

    logger.info(
        "Hybrid search fused dense=%d sparse_original=%d sparse_normalized=%d into %d results",
        len(dense_results),
        len(sparse_original_results),
        len(sparse_normalized_results),
        len(fused),
    )
    return fused[:top_k]


def _reciprocal_rank_fusion(
    ranked_result_sets: list[tuple[str, list[dict[str, Any]]]],
    rrf_k: int = _RRF_K,
) -> list[dict[str, Any]]:
    fused: dict[str, dict[str, Any]] = {}

    for source_name, results in ranked_result_sets:
        for rank, result in enumerate(results, 1):
            chunk_id = result["chunk_id"]
            if chunk_id not in fused:
                fused[chunk_id] = {**result, "retrieval_debug": {}}

            target = fused[chunk_id]
            target["retrieval_debug"][f"{source_name}_rank"] = rank
            target["retrieval_debug"][f"{source_name}_rrf"] = round(1 / (rrf_k + rank), 6)

            for score_key in (
                "dense_score",
                "sparse_original_score",
                "sparse_normalized_score",
            ):
                if score_key in result:
                    target["retrieval_debug"][score_key] = result[score_key]
                    target[score_key] = result[score_key]

            target["retrieval_debug"]["fusion_score"] = round(
                target["retrieval_debug"].get("fusion_score", 0.0) + 1 / (rrf_k + rank),
                6,
            )

    for result in fused.values():
        debug = result["retrieval_debug"]
        result["fusion_score"] = debug.get("fusion_score", 0.0)
        result["similarity"] = result.get("dense_score")

    return sorted(fused.values(), key=lambda item: item["fusion_score"], reverse=True)


similarity_search = dense_search


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
