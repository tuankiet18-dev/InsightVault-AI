from pydantic import BaseModel, Field


class ProcessDocumentRequest(BaseModel):
    document_id: str = Field(..., description="Document UUID in PostgreSQL")
    workspace_id: str = Field(..., description="Workspace UUID")
    folder_id: str | None = Field(None, description="Folder UUID, if any")
    minio_bucket: str = Field(..., description="MinIO bucket name")
    minio_object_key: str = Field(..., description="MinIO object key")
    file_type: str = Field(..., description="File type: pdf, docx, txt, md")
    file_name: str = Field(..., description="Display/original file name")
    model_name: str | None = Field(
        None,
        max_length=128,
        pattern=r"^[A-Za-z0-9][A-Za-z0-9._:/-]{0,127}$",
        description="Optional chat model override for document intelligence",
    )


class DocumentInsights(BaseModel):
    scope: list[str] = Field(default_factory=list)
    decisions: list[str] = Field(default_factory=list)
    risks: list[str] = Field(default_factory=list)
    gaps: list[str] = Field(default_factory=list)
    next_actions: list[str] = Field(default_factory=list)


class ProcessDocumentResponse(BaseModel):
    status: str = Field("success")
    document_id: str
    chunk_count: int
    document_type: str = Field("general_document")
    document_type_confidence: float = Field(0.0)
    audience_fit: str = Field("students_founders_pm_ba")
    summary: str
    key_points: list[str]
    insights: DocumentInsights = Field(default_factory=DocumentInsights)
    keywords: list[str]
    error: str | None = None
