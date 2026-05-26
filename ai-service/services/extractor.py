"""
Text extractor for supported document types.
Supports: PDF (text-based), DOCX, TXT, Markdown.
"""

import io
import re
from typing import Literal

import fitz  # PyMuPDF
from docx import Document as DocxDocument

SupportedFileType = Literal["pdf", "docx", "txt", "md", "markdown"]


def _clean_text(text: str) -> str:
    """Remove excessive whitespace while preserving paragraph structure."""
    # Normalise line endings
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    # Collapse more than 2 consecutive blank lines into 2
    text = re.sub(r"\n{3,}", "\n\n", text)
    # Remove lines that are only whitespace
    lines = [line.rstrip() for line in text.split("\n")]
    text = "\n".join(lines)
    return text.strip()


def extract_pdf(content: bytes) -> str:
    """Extract text from a text-based PDF file."""
    doc = fitz.open(stream=content, filetype="pdf")
    pages: list[str] = []
    for page in doc:
        pages.append(page.get_text("text"))  # type: ignore[arg-type]
    doc.close()
    return _clean_text("\n\n".join(pages))


def extract_docx(content: bytes) -> str:
    """Extract text from a DOCX file."""
    doc = DocxDocument(io.BytesIO(content))
    paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
    return _clean_text("\n\n".join(paragraphs))


def extract_txt(content: bytes) -> str:
    """Extract text from a plain text file."""
    text = content.decode("utf-8", errors="replace")
    return _clean_text(text)


def extract_markdown(content: bytes) -> str:
    """Extract text from a Markdown file (returns raw markdown text)."""
    text = content.decode("utf-8", errors="replace")
    return _clean_text(text)


def extract(file_type: str, content: bytes) -> str:
    """
    Dispatcher: extract text based on file_type.
    Raises ValueError for unsupported types.
    """
    ft = file_type.lower().strip(".")
    match ft:
        case "pdf":
            return extract_pdf(content)
        case "docx":
            return extract_docx(content)
        case "txt":
            return extract_txt(content)
        case "md" | "markdown":
            return extract_markdown(content)
        case _:
            raise ValueError(f"Unsupported file type: {file_type!r}")
