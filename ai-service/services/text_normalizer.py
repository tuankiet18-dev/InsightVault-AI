"""Text normalization helpers for sparse retrieval."""

import re
import unicodedata

_WHITESPACE_RE = re.compile(r"\s+")
_SEPARATORS_RE = re.compile(r"[^\w\s./:_-]+", re.UNICODE)


def normalize_for_sparse_search(text: str) -> str:
    """
    Normalize mixed Vietnamese/English text for sparse retrieval.

    Keeps technical tokens such as JWT, ERR-401, AI_ALLOW_REPORT_PERSISTENCE,
    paths, versions, and numbers while making Vietnamese accent-insensitive.
    """
    if not text:
        return ""

    decomposed = unicodedata.normalize("NFD", text)
    without_accents = "".join(
        char for char in decomposed if unicodedata.category(char) != "Mn"
    )
    without_accents = without_accents.replace("đ", "d").replace("Đ", "D")
    cleaned = _SEPARATORS_RE.sub(" ", without_accents)
    cleaned = _WHITESPACE_RE.sub(" ", cleaned)
    return cleaned.lower().strip()
