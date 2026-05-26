"""
POST /process-document
Full pipeline: read MinIO → extract text → chunk → embed → store pgvector → summarize.
"""

import logging

from fastapi import APIRouter, HTTPException
from minio import Minio

from core.config import settings
from models.process import ProcessDocumentRequest, ProcessDocumentResponse
from services.extractor import extract
from services.chunker import chunk_text
from services.embedder import embed_documents
from services.vector_store import insert_chunks, delete_chunks_by_document
from services.summarizer import generate_summary

router = APIRouter()
logger = logging.getLogger(__name__)


def _get_minio_client() -> Minio:
    return Minio(
        settings.MINIO_ENDPOINT,
        access_key=settings.MINIO_ACCESS_KEY,
        secret_key=settings.MINIO_SECRET_KEY,
        secure=settings.MINIO_SECURE,
    )


@router.post("/process-document", response_model=ProcessDocumentResponse)
async def process_document(req: ProcessDocumentRequest) -> ProcessDocumentResponse:
    """
    Full AI document processing pipeline.
    Called by the backend worker after file upload to MinIO.
    """
    logger.info(
        "Processing document %s (%s) for workspace %s",
        req.document_id, req.file_name, req.workspace_id,
    )

    # ── Step 1: Read file from MinIO ──────────────────────────────────────────
    try:
        minio_client = _get_minio_client()
        response = minio_client.get_object(req.minio_bucket, req.minio_object_key)
        file_content: bytes = response.read()
        response.close()
        response.release_conn()
    except Exception as exc:
        logger.error("Failed to read from MinIO: %s", exc)
        raise HTTPException(status_code=502, detail=f"MinIO read error: {exc}")

    # ── Step 2: Extract text ──────────────────────────────────────────────────
    try:
        text = extract(req.file_type, file_content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        logger.error("Text extraction failed for %s: %s", req.document_id, exc)
        raise HTTPException(status_code=500, detail=f"Text extraction error: {exc}")

    if not text.strip():
        raise HTTPException(
            status_code=422,
            detail="Document appears to be empty or contains no extractable text.",
        )

    # ── Step 3: Chunk text ────────────────────────────────────────────────────
    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=422, detail="Could not generate chunks from document.")

    logger.info("Generated %d chunks for document %s", len(chunks), req.document_id)

    # ── Step 4: Embed chunks ──────────────────────────────────────────────────
    try:
        texts = [c.content for c in chunks]
        embeddings = embed_documents(texts)
    except Exception as exc:
        logger.error("Embedding failed for %s: %s", req.document_id, exc)
        raise HTTPException(status_code=502, detail=f"Embedding error: {exc}")

    # ── Step 5: Delete old chunks (if reprocessing) + insert new ─────────────
    try:
        delete_chunks_by_document(req.document_id)
        insert_chunks(
            document_id=req.document_id,
            workspace_id=req.workspace_id,
            folder_id=req.folder_id,
            chunks_content=[c.content for c in chunks],
            embeddings=embeddings,
            token_counts=[c.token_count for c in chunks],
            metadata_list=[c.metadata for c in chunks],
        )
    except Exception as exc:
        logger.error("pgvector insert failed for %s: %s", req.document_id, exc)
        raise HTTPException(status_code=500, detail=f"Vector store error: {exc}")

    # ── Step 6: Generate summary ──────────────────────────────────────────────
    summary_result = generate_summary(text)

    logger.info(
        "Document %s processed successfully: %d chunks, summary %d chars",
        req.document_id, len(chunks), len(summary_result.get("summary", "")),
    )

    return ProcessDocumentResponse(
        document_id=req.document_id,
        chunk_count=len(chunks),
        summary=summary_result.get("summary", ""),
        key_points=summary_result.get("key_points", []),
        keywords=summary_result.get("keywords", []),
    )
