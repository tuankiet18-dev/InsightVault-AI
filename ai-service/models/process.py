from pydantic import BaseModel, Field
from typing import Any


class ProcessDocumentRequest(BaseModel):
    document_id: str = Field(..., description="UUID của document trong PostgreSQL")
    workspace_id: str = Field(..., description="UUID của workspace")
    folder_id: str | None = Field(None, description="UUID của folder (nếu có)")
    minio_bucket: str = Field(..., description="MinIO bucket name")
    minio_object_key: str = Field(..., description="MinIO object key (path to file)")
    file_type: str = Field(..., description="Loại file: pdf, docx, txt, md")
    file_name: str = Field(..., description="Tên file hiển thị")


class ProcessDocumentResponse(BaseModel):
    status: str = Field("success")
    document_id: str
    chunk_count: int
    summary: str
    key_points: list[str]
    keywords: list[str]
    error: str | None = None
