"""
Text chunker using tiktoken for accurate token counting.
Strategy: fixed-size chunks with overlap to preserve context across boundaries.
"""

from dataclasses import dataclass, field
from typing import Any

import tiktoken

from core.config import settings

# Use cl100k_base tokenizer (same as GPT-4 / compatible with Gemini token estimates)
_TOKENIZER = tiktoken.get_encoding("cl100k_base")


@dataclass
class Chunk:
    index: int
    content: str
    token_count: int
    metadata: dict[str, Any] = field(default_factory=dict)


def _count_tokens(text: str) -> int:
    return len(_TOKENIZER.encode(text))


def chunk_text(
    text: str,
    chunk_size: int = settings.CHUNK_SIZE_TOKENS,
    overlap: int = settings.CHUNK_OVERLAP_TOKENS,
) -> list[Chunk]:
    """
    Split text into overlapping token-based chunks.

    Args:
        text: The full extracted text to chunk.
        chunk_size: Target number of tokens per chunk.
        overlap: Number of tokens to overlap between consecutive chunks.

    Returns:
        List of Chunk objects with index, content, token_count, metadata.
    """
    if not text.strip():
        return []

    tokens = _TOKENIZER.encode(text)
    total_tokens = len(tokens)

    if total_tokens == 0:
        return []

    chunks: list[Chunk] = []
    start = 0
    chunk_index = 0

    while start < total_tokens:
        end = min(start + chunk_size, total_tokens)
        chunk_tokens = tokens[start:end]
        chunk_text_content = _TOKENIZER.decode(chunk_tokens)

        chunks.append(
            Chunk(
                index=chunk_index,
                content=chunk_text_content.strip(),
                token_count=len(chunk_tokens),
                metadata={
                    "token_start": start,
                    "token_end": end,
                    "total_document_tokens": total_tokens,
                },
            )
        )

        chunk_index += 1
        # Move forward by (chunk_size - overlap), minimum 1 to avoid infinite loop
        step = max(chunk_size - overlap, 1)
        start += step

        # Stop if we've covered all tokens
        if end >= total_tokens:
            break

    return chunks
