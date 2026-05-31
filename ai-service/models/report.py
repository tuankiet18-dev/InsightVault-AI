from typing import Literal

from pydantic import BaseModel, Field


class WebSearchOptions(BaseModel):
    enabled: bool = False
    provider: Literal["duckduckgo", "searxng", "brave"] | None = None
    max_results: int = Field(5, ge=1, le=10)


class GenerateReportRequest(BaseModel):
    workspace_id: str = Field(..., description="Workspace UUID")
    folder_id: str | None = Field(None, description="Optional folder UUID for saved report")
    created_by_id: str | None = Field(None, description="Optional user UUID creating the report")
    ai_job_id: str | None = Field(None, description="Optional AI job UUID")
    document_ids: list[str] = Field(..., min_length=1, description="Source document UUIDs")
    report_type: Literal[
        "summary_report",
        "comparison_report",
        "gap_analysis_report",
        "gap_conflict_report",
        "folder_report",
        "section_report",
        "custom_report",
    ] = Field("summary_report")
    title: str | None = Field(None, description="Report title when persisted")
    custom_prompt: str | None = Field(None, description="Additional instruction for section_report/custom_report")
    store_report: bool = Field(False, description="Persist generated Markdown into reports table")
    web_search_options: WebSearchOptions | None = Field(
        None,
        description="Reserved for later web search phase. Current AI service ignores it.",
    )


class GenerateReportResponse(BaseModel):
    report_type: str
    markdown_content: str
    report_id: str | None = None
