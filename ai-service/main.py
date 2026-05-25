from fastapi import FastAPI
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    message: str


class ServiceInfo(BaseModel):
    name: str
    responsibilities: list[str]


app = FastAPI(title="InsightVault AI Service", version="0.1.0")


@app.get("/", response_model=ServiceInfo)
def service_info():
    return ServiceInfo(
        name="InsightVault AI Service",
        responsibilities=[
            "extract document text",
            "chunk document content",
            "generate embeddings",
            "support RAG, comparison, and report generation",
        ],
    )



@app.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(status="ok", message="AI Service is running")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
