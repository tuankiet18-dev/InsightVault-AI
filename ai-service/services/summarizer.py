"""Document summarizer using document-aware prompt routing."""

from __future__ import annotations

import json
import logging
import time
from typing import Any

from core.chat_provider import chat_model
from core.config import settings
from services.document_classifier import classify_document
from services.prompt_templates import build_summary_prompt

logger = logging.getLogger(__name__)


def _truncate_for_summary(text: str, max_chars: int = 12000) -> str:
    """Truncate text to avoid exceeding provider context limits."""
    if len(text) <= max_chars:
        return text
    front = int(max_chars * 0.6)
    back = int(max_chars * 0.2)
    return text[:front] + "\n\n[...document continues...]\n\n" + text[-back:]


def _clean_json_text(raw: str) -> str:
    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return raw.strip()


def _as_string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [str(item).strip() for item in value if str(item).strip()]


def _normalize_insights(value: Any) -> dict[str, list[str]]:
    raw = value if isinstance(value, dict) else {}
    return {
        "scope": _as_string_list(raw.get("scope")),
        "decisions": _as_string_list(raw.get("decisions")),
        "risks": _as_string_list(raw.get("risks")),
        "gaps": _as_string_list(raw.get("gaps")),
        "next_actions": _as_string_list(raw.get("next_actions")),
    }


def generate_summary(text: str, file_name: str | None = None) -> dict[str, Any]:
    """Generate a document-aware summary with structured insights."""
    truncated = _truncate_for_summary(text)
    classification = classify_document(text, file_name)
    prompt = build_summary_prompt(truncated, classification)

    last_error: Exception | None = None
    delay = settings.GEMINI_RETRY_DELAY

    for attempt in range(1, settings.GEMINI_MAX_RETRIES + 1):
        try:
            raw = chat_model.generate_text(prompt)
            result = json.loads(_clean_json_text(raw))

            return {
                "document_type": result.get("document_type")
                or classification.document_type,
                "document_type_confidence": float(
                    result.get("document_type_confidence")
                    or classification.confidence
                ),
                "audience_fit": result.get("audience_fit")
                or classification.audience_fit,
                "summary": str(result.get("summary", "")).strip(),
                "key_points": _as_string_list(result.get("key_points")),
                "insights": _normalize_insights(result.get("insights")),
                "keywords": _as_string_list(result.get("keywords")),
            }
        except json.JSONDecodeError as exc:
            last_error = exc
            logger.warning("Summary JSON parse failed (attempt %d): %s", attempt, exc)
        except Exception as exc:
            last_error = exc
            logger.warning("Summary model call failed (attempt %d): %s", attempt, exc)

        if attempt < settings.GEMINI_MAX_RETRIES:
            time.sleep(delay)
            delay *= 2

    logger.error(
        "Summary generation failed after %d retries: %s",
        settings.GEMINI_MAX_RETRIES,
        last_error,
    )
    return {
        "document_type": classification.document_type,
        "document_type_confidence": classification.confidence,
        "audience_fit": classification.audience_fit,
        "summary": "",
        "key_points": [],
        "insights": {
            "scope": [],
            "decisions": [],
            "risks": [],
            "gaps": [],
            "next_actions": [],
        },
        "keywords": [],
    }
