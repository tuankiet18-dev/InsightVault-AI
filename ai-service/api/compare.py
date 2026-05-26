"""POST /compare — Document comparison endpoint."""

import logging

from fastapi import APIRouter, HTTPException

from models.compare import CompareRequest, CompareResponse
from services.compare_service import compare_documents

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/compare", response_model=CompareResponse)
async def compare(req: CompareRequest) -> CompareResponse:
    """Compare 2+ documents, detect gaps and conflicts."""
    if len(req.document_ids) != len(req.document_names):
        raise HTTPException(
            status_code=422,
            detail="document_ids and document_names must have the same length",
        )

    try:
        result = compare_documents(
            workspace_id=req.workspace_id,
            document_ids=req.document_ids,
            document_names=req.document_names,
        )
    except RuntimeError as exc:
        logger.error("Compare failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.error("Unexpected compare error: %s", exc)
        raise HTTPException(status_code=500, detail="Internal AI service error")

    return CompareResponse(**result)
