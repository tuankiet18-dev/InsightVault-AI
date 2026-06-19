"""POST /generate-report — Report generation endpoint."""

import logging

from fastapi import APIRouter, HTTPException

from core.config import settings
from models.report import GenerateReportRequest, GenerateReportResponse
from services.report_service import generate_report

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/generate-report", response_model=GenerateReportResponse)
async def report(req: GenerateReportRequest) -> GenerateReportResponse:
    """Generate a Markdown report from selected documents."""
    try:
        result = generate_report(
            workspace_id=req.workspace_id,
            folder_id=req.folder_id,
            created_by_id=req.created_by_id,
            ai_job_id=req.ai_job_id,
            document_ids=req.document_ids,
            report_type=req.report_type,
            title=req.title,
            custom_prompt=req.custom_prompt,
            store_report=req.store_report and settings.AI_ALLOW_REPORT_PERSISTENCE,
            model_name=req.model_name,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except RuntimeError as exc:
        logger.error("Report generation failed: %s", exc)
        raise HTTPException(status_code=502, detail=str(exc))
    except Exception as exc:
        logger.error("Unexpected report error: %s", exc)
        raise HTTPException(status_code=500, detail="Internal AI service error")

    return GenerateReportResponse(**result)
