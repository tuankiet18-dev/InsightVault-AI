"""
RAG (Retrieval-Augmented Generation) service.
Pipeline: embed question → retrieve chunks → build prompt → call Gemini → return answer + sources.
"""

import logging
import time

from core.config import settings
from core.chat_provider import chat_model
from services.embedder import embed_query
from services.vector_store import hybrid_search

logger = logging.getLogger(__name__)

_RAG_PROMPT_TEMPLATE = """Bạn là trợ lý AI của InsightVault, giúp người dùng hiểu nội dung tài liệu trong workspace.

HƯỚNG DẪN QUAN TRỌNG:
- CHỈ trả lời dựa trên các đoạn tài liệu được cung cấp bên dưới (Context).
- Nếu Context không có đủ thông tin để trả lời, hãy nói rõ: "Tôi không tìm thấy thông tin liên quan trong các tài liệu hiện có."
- KHÔNG bịa đặt thông tin không có trong tài liệu.
- Trả lời bằng ngôn ngữ của câu hỏi (tiếng Việt hoặc tiếng Anh).
- Trích dẫn nguồn tài liệu khi có thể.

{chat_history_section}

CONTEXT (Các đoạn tài liệu liên quan):
---
{context}
---

CÂU HỎI: {question}

TRẢ LỜI:"""

_CHAT_HISTORY_SECTION = """LỊCH SỬ HỘI THOẠI:
{history}

"""


def _build_context_block(chunks: list[dict]) -> str:
    """Format retrieved chunks into a context string."""
    parts = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(
            f"[{i}] Từ tài liệu: {chunk['file_name']}\n{chunk['content']}"
        )
    return "\n\n".join(parts)


def _build_chat_history(chat_history: list[dict]) -> str:
    """Format chat history list into readable text."""
    if not chat_history:
        return ""
    lines = []
    for msg in chat_history[-6:]:  # Keep last 6 turns to limit context size
        role = "Người dùng" if msg.get("role") == "user" else "AI"
        lines.append(f"{role}: {msg.get('content', '')}")
    return "\n".join(lines)


def query(
    question: str,
    workspace_id: str,
    scope: str = "workspace",
    folder_id: str | None = None,
    document_ids: list[str] | None = None,
    top_k: int = settings.RAG_TOP_K,
    chat_history: list[dict] | None = None,
) -> dict:
    """
    Execute the full RAG pipeline.

    Args:
        question: User's question (Vietnamese or English).
        workspace_id: Required for permission scoping.
        scope: "workspace" | "folder" | "document"
        folder_id: Required when scope="folder".
        document_ids: Required when scope="document".
        top_k: Number of chunks to retrieve.
        chat_history: List of {"role": "user"|"assistant", "content": str}.

    Returns:
        dict with keys: answer (str), sources (list[dict])
    """
    logger.info("RAG query: scope=%s workspace=%s question=%r", scope, workspace_id, question[:80])

    # Step 1: Embed the question
    query_vector = embed_query(question)

    # Step 2: Retrieve relevant chunks with hybrid dense + sparse search
    chunks = hybrid_search(
        query_text=question,
        query_vector=query_vector,
        workspace_id=workspace_id,
        folder_id=folder_id if scope == "folder" else None,
        document_ids=document_ids if scope == "document" else None,
        top_k=top_k,
    )

    if not chunks:
        logger.info("No relevant chunks found for query in workspace %s", workspace_id)
        return {
            "answer": "Tôi không tìm thấy thông tin liên quan trong các tài liệu hiện có trong workspace.",
            "sources": [],
        }

    # Step 3: Build prompt
    context_block = _build_context_block(chunks)
    history_text = _build_chat_history(chat_history or [])
    chat_history_section = (
        _CHAT_HISTORY_SECTION.format(history=history_text) if history_text else ""
    )

    prompt = _RAG_PROMPT_TEMPLATE.format(
        chat_history_section=chat_history_section,
        context=context_block,
        question=question,
    )

    # Step 4: Call Gemini with retry
    last_error: Exception | None = None
    delay = settings.GEMINI_RETRY_DELAY

    for attempt in range(1, settings.GEMINI_MAX_RETRIES + 1):
        try:
            answer = chat_model.generate_text(prompt)
            break
        except Exception as exc:
            last_error = exc
            logger.warning("RAG Gemini call attempt %d failed: %s", attempt, exc)
            if attempt < settings.GEMINI_MAX_RETRIES:
                time.sleep(delay)
                delay *= 2
    else:
        raise RuntimeError(
            f"RAG Gemini call failed after {settings.GEMINI_MAX_RETRIES} retries: {last_error}"
        )

    # Step 5: Format sources/citations
    sources = [
        {
            "chunk_id": chunk["chunk_id"],
            "document_id": chunk["document_id"],
            "file_name": chunk["file_name"],
            "snippet": chunk["content"][:300] + ("..." if len(chunk["content"]) > 300 else ""),
            "similarity": chunk["similarity"],
            "retrieval_debug": chunk.get("retrieval_debug", {}),
        }
        for chunk in chunks
    ]

    logger.info("RAG query answered with %d sources", len(sources))
    return {"answer": answer, "sources": sources}
