from pydantic import BaseModel, Field
from typing import Literal


class GenerateReportRequest(BaseModel):
    workspace_id: str = Field(..., description="UUID của workspace")
    document_ids: list[str] = Field(..., min_length=1, description="Danh sách UUID documents")
    report_type: Literal[
        "summary_report", "comparison_report", "gap_analysis_report", "section_report"
    ] = Field("summary_report")
    custom_prompt: str | None = Field(None, description="Yêu cầu bổ sung cho section_report")


class GenerateReportResponse(BaseModel):
    report_type: str
    markdown_content: str
