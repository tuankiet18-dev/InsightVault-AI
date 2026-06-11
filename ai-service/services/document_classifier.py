"""Lightweight document type classifier for prompt routing."""

from __future__ import annotations

from dataclasses import dataclass
import re


SUPPORTED_DOCUMENT_TYPES = {
    "prd",
    "mvp_spec",
    "business_proposal",
    "meeting_note",
    "technical_doc",
    "project_report",
    "cv_profile",
    "research_note",
    "internal_knowledge",
    "general_document",
}

PRIMARY_TARGET_AUDIENCE = "students_founders_pm_ba"


@dataclass(frozen=True)
class DocumentClassification:
    document_type: str
    confidence: float
    audience_fit: str


_TYPE_SIGNALS: dict[str, tuple[str, ...]] = {
    "prd": (
        "prd",
        "product requirement",
        "user story",
        "acceptance criteria",
        "feature requirement",
        "persona",
    ),
    "mvp_spec": (
        "mvp",
        "minimum viable product",
        "core feature",
        "scope",
        "out of scope",
        "user flow",
    ),
    "business_proposal": (
        "business model",
        "revenue",
        "market",
        "competitor",
        "customer segment",
        "value proposition",
        "proposal",
    ),
    "meeting_note": (
        "meeting",
        "minutes",
        "attendees",
        "action item",
        "next steps",
        "decision",
    ),
    "technical_doc": (
        "architecture",
        "api",
        "database",
        "endpoint",
        "deployment",
        "sequence diagram",
        "schema",
    ),
    "project_report": (
        "report",
        "progress",
        "result",
        "timeline",
        "risk",
        "deliverable",
        "milestone",
    ),
    "cv_profile": (
        "resume",
        "curriculum vitae",
        "experience",
        "education",
        "skills",
        "github",
        "linkedin",
    ),
    "research_note": (
        "abstract",
        "methodology",
        "literature",
        "finding",
        "hypothesis",
        "citation",
        "references",
    ),
    "internal_knowledge": (
        "runbook",
        "onboarding",
        "sop",
        "policy",
        "playbook",
        "internal",
        "knowledge base",
    ),
}


def classify_document(text: str, file_name: str | None = None) -> DocumentClassification:
    """Classify document by stable lexical signals before LLM summarization."""
    sample = " ".join(part for part in (file_name or "", text[:20000]) if part).lower()
    sample = re.sub(r"\s+", " ", sample)

    scores: dict[str, int] = {}
    for document_type, signals in _TYPE_SIGNALS.items():
        score = 0
        for signal in signals:
            if signal in sample:
                score += 2 if " " in signal else 1
        scores[document_type] = score

    best_type, best_score = max(scores.items(), key=lambda item: item[1])
    if best_score <= 0:
        return DocumentClassification(
            document_type="general_document",
            confidence=0.35,
            audience_fit=PRIMARY_TARGET_AUDIENCE,
        )

    total_score = sum(scores.values()) or best_score
    confidence = min(0.95, max(0.45, best_score / total_score + 0.35))
    return DocumentClassification(
        document_type=best_type,
        confidence=round(confidence, 2),
        audience_fit=PRIMARY_TARGET_AUDIENCE,
    )
