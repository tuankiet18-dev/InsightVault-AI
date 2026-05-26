"""
InsightVault AI Service — FastAPI application entry point.
"""

import logging

from fastapi import FastAPI
from pydantic import BaseModel

from api.process import router as process_router
from api.rag import router as rag_router
from api.compare import router as compare_router
from api.report import router as report_router

# ── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="InsightVault AI Service",
    version="0.2.0",
    description=(
        "AI service for InsightVault: document processing, RAG chat, "
        "comparison, gap detection, and Markdown report generation."
    ),
)

# ── Routes ────────────────────────────────────────────────────────────────────
app.include_router(process_router, tags=["Document Processing"])
app.include_router(rag_router, tags=["RAG Chat"])
app.include_router(compare_router, tags=["Comparison"])
app.include_router(report_router, tags=["Reports"])


# ── Health & Info ─────────────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    status: str
    message: str


class ServiceInfo(BaseModel):
    name: str
    version: str
    responsibilities: list[str]


@app.get("/", response_model=ServiceInfo, tags=["Meta"])
def service_info() -> ServiceInfo:
    return ServiceInfo(
        name="InsightVault AI Service",
        version="0.2.0",
        responsibilities=[
            "Extract text from PDF, DOCX, TXT, Markdown",
            "Chunk and embed documents with Gemini text-embedding-004 (768d)",
            "Store and search vectors with pgvector (HNSW cosine)",
            "Generate document summaries, key points, keywords",
            "RAG chat with source citations",
            "Compare documents and detect gaps/conflicts",
            "Generate structured Markdown reports",
        ],
    )


@app.get("/health", response_model=HealthResponse, tags=["Meta"])
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", message="AI Service is running")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
