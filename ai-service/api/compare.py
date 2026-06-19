"""POST /compare — Document comparison endpoint."""

import logging

from fastapi import APIRouter, HTTPException

from core.config import settings
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
            folder_id=req.folder_id,
            created_by_id=req.created_by_id,
            ai_job_id=req.ai_job_id,
            document_ids=req.document_ids,
            document_names=req.document_names,
            title=req.title,
            store_report=req.store_report and settings.AI_ALLOW_REPORT_PERSISTENCE,
            model_name=req.model_name,
        )
    except RuntimeError as exc:
        logger.error("Compare failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.error("Unexpected compare error: %s", exc)
        raise HTTPException(status_code=500, detail="Internal AI service error")

    return CompareResponse(**result)
