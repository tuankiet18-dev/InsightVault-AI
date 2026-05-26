"""POST /rag/query — RAG chat endpoint."""

import logging

from fastapi import APIRouter, HTTPException

from models.rag import RagQueryRequest, RagQueryResponse, RagSource
from services.rag_service import query as rag_query

router = APIRouter(prefix="/rag")
logger = logging.getLogger(__name__)


@router.post("/query", response_model=RagQueryResponse)
async def rag_chat(req: RagQueryRequest) -> RagQueryResponse:
    """
    Execute RAG query and return answer with source citations.
    Backend passes scope + IDs; permission validation is done by backend.
    """
    # Validate scope inputs
    if req.scope == "folder" and not req.folder_id:
        raise HTTPException(
            status_code=422, detail="folder_id is required when scope='folder'"
        )
    if req.scope == "document" and not req.document_ids:
        raise HTTPException(
            status_code=422, detail="document_ids is required when scope='document'"
        )

    try:
        result = rag_query(
            question=req.question,
            workspace_id=req.workspace_id,
            scope=req.scope,
            folder_id=req.folder_id,
            document_ids=req.document_ids,
            top_k=req.top_k,
            chat_history=[m.model_dump() for m in req.chat_history],
        )
    except RuntimeError as exc:
        logger.error("RAG query failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.error("Unexpected RAG error: %s", exc)
        raise HTTPException(status_code=500, detail="Internal AI service error")

    return RagQueryResponse(
        answer=result["answer"],
        sources=[RagSource(**s) for s in result["sources"]],
    )
