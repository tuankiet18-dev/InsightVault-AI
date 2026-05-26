from pydantic import BaseModel, Field
from typing import Literal


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class RagQueryRequest(BaseModel):
    question: str = Field(..., min_length=1, description="Câu hỏi của user")
    workspace_id: str = Field(..., description="UUID của workspace (bắt buộc)")
    scope: Literal["workspace", "folder", "document"] = Field(
        "workspace", description="Phạm vi tìm kiếm"
    )
    folder_id: str | None = Field(None, description="UUID folder — bắt buộc khi scope=folder")
    document_ids: list[str] | None = Field(
        None, description="Danh sách UUID documents — bắt buộc khi scope=document"
    )
    top_k: int = Field(5, ge=1, le=20)
    chat_history: list[ChatHistoryMessage] = Field(default_factory=list)


class RagSource(BaseModel):
    chunk_id: str
    document_id: str
    file_name: str
    snippet: str
    similarity: float


class RagQueryResponse(BaseModel):
    answer: str
    sources: list[RagSource]
