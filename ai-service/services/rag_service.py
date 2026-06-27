"""
RAG (Retrieval-Augmented Generation) service.
Pipeline: embed question -> retrieve chunks -> build prompt -> call Gemini -> return answer + sources.
"""

import logging
import time

from core.config import settings
from core.chat_provider import chat_model, get_chat_model
from services.embedder import embed_query
from services.vector_store import hybrid_search

logger = logging.getLogger(__name__)

_RAG_PROMPT_TEMPLATE = """Bạn là trợ lý AI của InsightVault, giúp người dùng hiểu tài liệu trong workspace.
Hãy trả lời theo tinh thần "LLM Wiki": chắt lọc điều quan trọng từ bằng chứng đã truy xuất,
không kể lại toàn bộ context.

HƯỚNG DẪN QUAN TRỌNG:
- CHỈ trả lời dựa trên các đoạn tài liệu được cung cấp trong Context.
- Nếu Context không đủ thông tin, nói rõ: "Tôi không tìm thấy thông tin liên quan trong các tài liệu hiện có."
- KHÔNG bịa đặt thông tin không có trong tài liệu.
- Trả lời bằng ngôn ngữ của câu hỏi.
- Ưu tiên câu trả lời có cấu trúc ngắn: kết luận trực tiếp, các ý chính, bằng chứng, gap/rủi ro nếu có.
- Khi một ý là suy luận từ context chứ không được nói trực tiếp, đánh dấu "^[inferred]".
- Khi context mơ hồ, thiếu căn cứ, hoặc các nguồn có khả năng mâu thuẫn, đánh dấu "^[ambiguous]".
- Trích dẫn nguồn bằng dạng [1], [2] tương ứng với Context khi có thể.
- Nếu người dùng hỏi "tóm tắt", hãy tóm tắt đúng trọng tâm: mục tiêu, quyết định, rủi ro, gap, hành động tiếp theo.

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


_CHAT_HISTORY_SECTION = """LICH SU HOI THOAI GAN DAY:
{history}

"""

_RAG_PROMPT_TEMPLATE = """Ban la tro ly AI cua InsightVault. Tra loi dua tren cac doan tai lieu trong Context va lich su hoi thoai neu co.

NGUYEN TAC BAT BUOC:
- Chi dua ra ket luan khi co bang chung trong Context. Neu thieu bang chung, noi ro "Chua du bang chung trong tai lieu duoc truy xuat" thay vi suy doan.
- Khi so sanh nhieu file, hay lan luot kiem tra tung file duoc mention; khong ket luan mot service/thanh phan "khong co" neu Context cua file do khong du day du.
- Uu tien cau tra loi ngan, co cau truc: ket luan truc tiep, diem khac nhau/giong nhau, bang chung, gap/rui ro.
- Tra loi bang ngon ngu cua cau hoi.
- Khong sinh cac marker ky thuat nhu ^[ambiguous] hoac ^[inferred]. Neu can, viet tu nhien: "can kiem chung" hoac "day la suy luan tu tai lieu".
- Trich dan nguon bang [1], [2] tuong ung voi Context khi co the.
- Neu Context khong du thong tin, noi ro phan nao thieu va de xuat nguoi dung mo chunk/source lien quan.

{chat_history_section}

CONTEXT:
---
{context}
---

CAU HOI: {question}

TRA LOI:"""


def _clean_answer_markers(answer: str) -> str:
    return (
        answer.replace("^[ambiguous]", " (can kiem chung)")
        .replace("^[inferred]", " (suy luan tu tai lieu)")
    )


def _build_context_block(chunks: list[dict]) -> str:
    """Format retrieved chunks into a context string."""
    parts = []
    for i, chunk in enumerate(chunks, 1):
        parts.append(
            f"[{i}] Từ tài liệu: {chunk['file_name']}\n{chunk['content']}"
        )
    return "\n\n".join(parts)


def _build_report_context_block(report_context: str | None, chunks: list[dict]) -> str:
    parts = []
    if report_context:
        parts.append(f"[REPORT] Báo cáo hiện tại\n{report_context.strip()}")
    if chunks:
        parts.append(_build_context_block(chunks))
    return "\n\n".join(parts)


def _build_chat_history(chat_history: list[dict]) -> str:
    """Format chat history list into readable text."""
    if not chat_history:
        return ""
    lines = []
    for msg in chat_history[-6:]:  # Keep last 6 turns to limit context size.
        role = "Người dùng" if msg.get("role") == "user" else "AI"
        lines.append(f"{role}: {msg.get('content', '')}")
    return "\n".join(lines)


def query(
    question: str,
    workspace_id: str,
    scope: str = "workspace",
    folder_id: str | None = None,
    document_ids: list[str] | None = None,
    report_context: str | None = None,
    top_k: int = settings.RAG_TOP_K,
    chat_history: list[dict] | None = None,
    model_name: str | None = None,
    web_search_options: dict | None = None,
) -> dict:
    """
    Execute the full RAG pipeline.

    Args:
        question: User's question (Vietnamese or English).
        workspace_id: Required for permission scoping.
        scope: "workspace" | "folder" | "document" | "report".
        folder_id: Required when scope="folder".
        document_ids: Required when scope="document".
        top_k: Number of chunks to retrieve.
        chat_history: List of {"role": "user"|"assistant", "content": str}.

    Returns:
        dict with keys: answer (str), sources (list[dict])
    """
    logger.info(
        "RAG query: scope=%s workspace=%s model=%s web_search=%s question=%r",
        scope,
        workspace_id,
        model_name or chat_model.model_name,
        bool(web_search_options and web_search_options.get("enabled")),
        question[:80],
    )

    # Step 1: Embed the question.
    query_vector = embed_query(question)

    # Step 2: Retrieve relevant chunks with hybrid dense + sparse search.
    chunks = hybrid_search(
        query_text=question,
        query_vector=query_vector,
        workspace_id=workspace_id,
        folder_id=folder_id if scope == "folder" else None,
        document_ids=document_ids if scope in {"document", "report"} else None,
        top_k=top_k,
    )

    if not chunks and not report_context:
        logger.info("No relevant chunks found for query in workspace %s", workspace_id)
        return {
            "answer": "Tôi không tìm thấy thông tin liên quan trong các tài liệu hiện có trong workspace.",
            "sources": [],
        }

    # Step 3: Build prompt.
    context_block = (
        _build_report_context_block(report_context, chunks)
        if scope == "report"
        else _build_context_block(chunks)
    )
    history_text = _build_chat_history(chat_history or [])
    chat_history_section = (
        _CHAT_HISTORY_SECTION.format(history=history_text) if history_text else ""
    )

    prompt = _RAG_PROMPT_TEMPLATE.format(
        chat_history_section=chat_history_section,
        context=context_block,
        question=question,
    )

    # Step 4: Call Gemini with retry.
    last_error: Exception | None = None
    delay = settings.GEMINI_RETRY_DELAY
    model = get_chat_model(model_name)

    for attempt in range(1, settings.GEMINI_MAX_RETRIES + 1):
        try:
            answer = _clean_answer_markers(model.generate_text(prompt))
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

    # Step 5: Format sources/citations.
    sources = [
        {
            "chunk_id": chunk["chunk_id"],
            "document_id": chunk["document_id"],
            "file_name": chunk["file_name"],
            "snippet": chunk["content"][:300] + ("..." if len(chunk["content"]) > 300 else ""),
            "similarity": chunk["similarity"],
            "chunk_index": chunk.get("chunk_index"),
            "page_number": chunk.get("metadata", {}).get("page_number") or chunk.get("metadata", {}).get("page"),
            "retrieval_debug": chunk.get("retrieval_debug", {}),
        }
        for chunk in chunks
    ]

    logger.info("RAG query answered with %d sources", len(sources))
    return {"answer": answer, "sources": sources}

def query_stream(
    question: str,
    workspace_id: str,
    scope: str = "workspace",
    folder_id: str | None = None,
    document_ids: list[str] | None = None,
    report_context: str | None = None,
    top_k: int = settings.RAG_TOP_K,
    chat_history: list[dict] | None = None,
    model_name: str | None = None,
    web_search_options: dict | None = None,
):
    import json
    
    # Step 1: Embed the question.
    query_vector = embed_query(question)

    # Step 2: Retrieve relevant chunks with hybrid dense + sparse search.
    chunks = hybrid_search(
        query_text=question,
        query_vector=query_vector,
        workspace_id=workspace_id,
        folder_id=folder_id if scope == "folder" else None,
        document_ids=document_ids if scope in {"document", "report"} else None,
        top_k=top_k,
    )

    if not chunks and not report_context:
        yield f"data: {json.dumps({'event': 'sources', 'data': []})}\n\n"
        yield f"data: {json.dumps({'event': 'chunk', 'data': 'Tôi không tìm thấy thông tin liên quan trong các tài liệu hiện có trong workspace.'})}\n\n"
        return

    # Step 3: Format sources and yield them first
    sources = [
        {
            "chunk_id": chunk["chunk_id"],
            "document_id": chunk["document_id"],
            "file_name": chunk["file_name"],
            "snippet": chunk["content"][:300] + ("..." if len(chunk["content"]) > 300 else ""),
            "similarity": chunk["similarity"],
            "chunk_index": chunk.get("chunk_index"),
            "page_number": chunk.get("metadata", {}).get("page_number") or chunk.get("metadata", {}).get("page"),
            "retrieval_debug": chunk.get("retrieval_debug", {}),
        }
        for chunk in chunks
    ]
    yield f"data: {json.dumps({'event': 'sources', 'data': sources})}\n\n"

    # Step 4: Build prompt.
    context_block = (
        _build_report_context_block(report_context, chunks)
        if scope == "report"
        else _build_context_block(chunks)
    )
    history_text = _build_chat_history(chat_history or [])
    chat_history_section = (
        _CHAT_HISTORY_SECTION.format(history=history_text) if history_text else ""
    )

    prompt = _RAG_PROMPT_TEMPLATE.format(
        chat_history_section=chat_history_section,
        context=context_block,
        question=question,
    )

    # Step 5: Stream Gemini chunks
    model = get_chat_model(model_name)
    try:
        for text_chunk in model.generate_text_stream(prompt):
            text_chunk = _clean_answer_markers(text_chunk)
            yield f"data: {json.dumps({'event': 'chunk', 'data': text_chunk})}\n\n"
    except Exception as exc:
        logger.error("RAG Gemini stream failed: %s", exc)
        yield f"data: {json.dumps({'event': 'error', 'data': str(exc)})}\n\n"

