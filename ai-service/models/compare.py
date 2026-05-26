from pydantic import BaseModel, Field


class CompareRequest(BaseModel):
    workspace_id: str = Field(..., description="Workspace UUID")
    folder_id: str | None = Field(None, description="Optional folder UUID for saved report")
    created_by_id: str | None = Field(None, description="Optional user UUID creating the report")
    ai_job_id: str | None = Field(None, description="Optional AI job UUID")
    document_ids: list[str] = Field(..., min_length=2, description="At least 2 document UUIDs")
    document_names: list[str] = Field(..., description="Display names matching document_ids")
    title: str | None = Field(None, description="Report title when persisted")
    store_report: bool = Field(True, description="Persist comparison result into reports table")


class CompareResponse(BaseModel):
    objectives: str
    scope: str
    similarities: list[str]
    differences: list[str]
    missing_information: list[str]
    potential_conflicts: list[str]
    recommendations: list[str]
    raw_markdown: str
    report_id: str | None = None
