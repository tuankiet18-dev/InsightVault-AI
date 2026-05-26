from pydantic import BaseModel, Field


class CompareRequest(BaseModel):
    workspace_id: str = Field(..., description="UUID của workspace")
    document_ids: list[str] = Field(..., min_length=2, description="Danh sách UUID documents (tối thiểu 2)")
    document_names: list[str] = Field(..., description="Tên hiển thị của các documents")


class CompareResponse(BaseModel):
    objectives: str
    scope: str
    similarities: list[str]
    differences: list[str]
    missing_information: list[str]
    potential_conflicts: list[str]
    recommendations: list[str]
    raw_markdown: str
