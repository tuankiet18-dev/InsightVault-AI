"""
Document summarizer using Gemini.
Generates: summary, key_points, keywords from extracted text.
Supports both Vietnamese and English content.
"""

import json
import logging
import time

from core.config import settings
from core.gemini import gemini_chat_model

logger = logging.getLogger(__name__)

_SUMMARY_PROMPT = """Bạn là một trợ lý phân tích tài liệu chuyên nghiệp.
Hãy phân tích tài liệu sau và trả về kết quả theo định dạng JSON chính xác.

Tài liệu:
---
{text}
---

Yêu cầu:
- Trả về ĐÚNG định dạng JSON, không có text nào ngoài JSON
- Ngôn ngữ của summary và key_points: cùng ngôn ngữ với tài liệu (Việt hoặc Anh)
- keywords: luôn bằng tiếng Anh, lowercase

{{
  "summary": "Tóm tắt ngắn gọn nội dung tài liệu (2-4 câu)",
  "key_points": [
    "Điểm chính 1",
    "Điểm chính 2",
    "Điểm chính 3",
    "Điểm chính 4",
    "Điểm chính 5"
  ],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}}"""


def _truncate_for_summary(text: str, max_chars: int = 12000) -> str:
    """Truncate text to avoid exceeding Gemini context limits for summary."""
    if len(text) <= max_chars:
        return text
    # Take first 60% + last 20% to capture intro and conclusion
    front = int(max_chars * 0.6)
    back = int(max_chars * 0.2)
    return text[:front] + "\n\n[...tài liệu tiếp tục...]\n\n" + text[-back:]


def generate_summary(text: str) -> dict:
    """
    Generate document summary, key points, and keywords.

    Returns:
        dict with keys: summary (str), key_points (list[str]), keywords (list[str])
    """
    truncated = _truncate_for_summary(text)
    prompt = _SUMMARY_PROMPT.format(text=truncated)

    last_error: Exception | None = None
    delay = settings.GEMINI_RETRY_DELAY

    for attempt in range(1, settings.GEMINI_MAX_RETRIES + 1):
        try:
            response = gemini_chat_model.generate_content(prompt)
            raw = response.text.strip()

            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]

            result = json.loads(raw)

            return {
                "summary": result.get("summary", ""),
                "key_points": result.get("key_points", []),
                "keywords": result.get("keywords", []),
            }

        except json.JSONDecodeError as exc:
            last_error = exc
            logger.warning("Summary JSON parse failed (attempt %d): %s", attempt, exc)
        except Exception as exc:
            last_error = exc
            logger.warning("Summary Gemini call failed (attempt %d): %s", attempt, exc)

        if attempt < settings.GEMINI_MAX_RETRIES:
            time.sleep(delay)
            delay *= 2

    logger.error("Summary generation failed after %d retries: %s", settings.GEMINI_MAX_RETRIES, last_error)
    # Return empty fallback rather than crashing the whole pipeline
    return {"summary": "", "key_points": [], "keywords": []}
