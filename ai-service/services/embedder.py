"""
Embedding service using Gemini text-embedding-004.
Dimension: 768 (matches backend vector(768) schema).
Supports batch embedding with retry and rate-limit handling.
"""

import time
import logging
from typing import Any

import google.generativeai as genai

from core.config import settings

logger = logging.getLogger(__name__)

genai.configure(api_key=settings.GEMINI_API_KEY)

_TASK_TYPE_DOCUMENT = "RETRIEVAL_DOCUMENT"
_TASK_TYPE_QUERY = "RETRIEVAL_QUERY"


def _embed_with_retry(
    texts: list[str],
    task_type: str,
) -> list[list[float]]:
    """
    Embed a batch of texts with exponential backoff retry.
    Returns list of 768-dimension float vectors.
    """
    last_error: Exception | None = None
    delay = settings.GEMINI_RETRY_DELAY

    for attempt in range(1, settings.GEMINI_MAX_RETRIES + 1):
        try:
            result = genai.embed_content(
                model=settings.GEMINI_EMBEDDING_MODEL,
                content=texts,
                task_type=task_type,
                output_dimensionality=settings.GEMINI_EMBEDDING_DIMENSION,
            )
            # result["embedding"] is list[list[float]] for batch, list[float] for single
            embeddings = result["embedding"]
            if isinstance(embeddings[0], float):
                # Single text — wrap in list
                embeddings = [embeddings]
            return embeddings  # type: ignore[return-value]

        except Exception as exc:
            last_error = exc
            logger.warning(
                "Embedding attempt %d/%d failed: %s",
                attempt,
                settings.GEMINI_MAX_RETRIES,
                exc,
            )
            if attempt < settings.GEMINI_MAX_RETRIES:
                time.sleep(delay)
                delay *= 2  # exponential backoff

    raise RuntimeError(
        f"Embedding failed after {settings.GEMINI_MAX_RETRIES} retries: {last_error}"
    )


def embed_documents(texts: list[str]) -> list[list[float]]:
    """
    Embed a list of document texts in batches.
    Uses RETRIEVAL_DOCUMENT task type for storage.
    """
    if not texts:
        return []

    batch_size = settings.EMBEDDING_BATCH_SIZE
    all_embeddings: list[list[float]] = []

    for i in range(0, len(texts), batch_size):
        batch = texts[i : i + batch_size]
        logger.info(
            "Embedding batch %d/%d (%d texts)",
            i // batch_size + 1,
            (len(texts) - 1) // batch_size + 1,
            len(batch),
        )
        batch_embeddings = _embed_with_retry(batch, _TASK_TYPE_DOCUMENT)
        all_embeddings.extend(batch_embeddings)

        # Small sleep between batches to stay within rate limits
        if i + batch_size < len(texts):
            time.sleep(0.5)

    return all_embeddings


def embed_query(text: str) -> list[float]:
    """
    Embed a single query string.
    Uses RETRIEVAL_QUERY task type for better retrieval performance.
    """
    embeddings = _embed_with_retry([text], _TASK_TYPE_QUERY)
    return embeddings[0]
