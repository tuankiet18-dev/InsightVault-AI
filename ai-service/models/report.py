from typing import Literal

from pydantic import BaseModel, Field


class GenerateReportRequest(BaseModel):
    workspace_id: str = Field(..., description="Workspace UUID")
    folder_id: str | None = Field(None, description="Optional folder UUID for saved report")
    created_by_id: str | None = Field(None, description="Optional user UUID creating the report")
    ai_job_id: str | None = Field(None, description="Optional AI job UUID")
    document_ids: list[str] = Field(..., min_length=1, description="Source document UUIDs")
    report_type: Literal[
        "summary_report", "comparison_report", "gap_analysis_report", "section_report"
    ] = Field("summary_report")
    title: str | None = Field(None, description="Report title when persisted")
    custom_prompt: str | None = Field(None, description="Additional instruction for section_report")
    store_report: bool = Field(True, description="Persist generated Markdown into reports table")


class GenerateReportResponse(BaseModel):
    report_type: str
    markdown_content: str
    report_id: str | None = None
