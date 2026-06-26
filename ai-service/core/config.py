import os
from dotenv import load_dotenv

load_dotenv()


def _read_gemini_api_key() -> str:
    return os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY", "")


class Settings:
    # Generation provider
    CHAT_PROVIDER: str = os.getenv("CHAT_PROVIDER", "gemini").lower()
    CHAT_TEMPERATURE: float = float(os.getenv("CHAT_TEMPERATURE", "0.2"))

    # Gemini
    GEMINI_API_KEY: str = _read_gemini_api_key()
    GEMINI_EMBEDDING_MODEL: str = os.getenv("GEMINI_EMBEDDING_MODEL", "models/gemini-embedding-001")
    GEMINI_EMBEDDING_DIMENSION: int = 768
    GEMINI_CHAT_MODEL: str = os.getenv("GEMINI_CHAT_MODEL", "models/gemini-2.5-flash")

    # Groq
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_BASE_URL: str = os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai/v1")
    GROQ_CHAT_MODEL: str = os.getenv("GROQ_CHAT_MODEL", "llama-3.3-70b-versatile")

    # PostgreSQL / pgvector
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    AI_ALLOW_REPORT_PERSISTENCE: bool = os.getenv("AI_ALLOW_REPORT_PERSISTENCE", "false").lower() == "true"

    # MinIO
    MINIO_ENDPOINT: str = os.getenv("MINIO_ENDPOINT", "localhost:9000")
    MINIO_ACCESS_KEY: str = os.getenv("MINIO_ACCESS_KEY", "admin")
    MINIO_SECRET_KEY: str = os.getenv("MINIO_SECRET_KEY", "password123")
    MINIO_SECURE: bool = os.getenv("MINIO_SECURE", "false").lower() == "true"

    # Processing
    CHUNK_SIZE_TOKENS: int = int(os.getenv("CHUNK_SIZE_TOKENS", "800"))
    CHUNK_OVERLAP_TOKENS: int = int(os.getenv("CHUNK_OVERLAP_TOKENS", "100"))
    EMBEDDING_BATCH_SIZE: int = int(os.getenv("EMBEDDING_BATCH_SIZE", "20"))
    RAG_TOP_K: int = int(os.getenv("RAG_TOP_K", "5"))
    RAG_DENSE_TOP_K: int = int(os.getenv("RAG_DENSE_TOP_K", "10"))
    RAG_SPARSE_TOP_K: int = int(os.getenv("RAG_SPARSE_TOP_K", "10"))
    RAG_SIMILARITY_THRESHOLD: float = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.5"))

    # Retry
    GEMINI_MAX_RETRIES: int = int(os.getenv("GEMINI_MAX_RETRIES", "3"))
    GEMINI_RETRY_DELAY: float = float(os.getenv("GEMINI_RETRY_DELAY", "2.0"))


settings = Settings()

if settings.GEMINI_API_KEY and not os.getenv("GOOGLE_API_KEY"):
    os.environ["GOOGLE_API_KEY"] = settings.GEMINI_API_KEY


def current_chat_model_name() -> str:
    if settings.CHAT_PROVIDER == "groq":
        return settings.GROQ_CHAT_MODEL
    return settings.GEMINI_CHAT_MODEL
