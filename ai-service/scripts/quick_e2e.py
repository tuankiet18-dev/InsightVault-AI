r"""
Quick local E2E test for AI development before backend upload flow exists.

Usage from ai-service:
    .\venv\Scripts\python.exe scripts\quick_e2e.py

Optional:
    .\venv\Scripts\python.exe scripts\quick_e2e.py --bucket document --object-key path/file.txt --file-type txt
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys
import uuid
from pathlib import Path

import psycopg2
import requests
from dotenv import load_dotenv
from minio import Minio


DEFAULT_TEXT = """InsightVault AI quick E2E test document.

The project codename is Lotus Bridge.
InsightVault stores source files in MinIO, metadata and vectors in PostgreSQL with pgvector,
and uses Gemini for embeddings, RAG answers, summaries, comparisons, and reports.
The expected retrieval fact is: Lotus Bridge connects MinIO, PostgreSQL, and Gemini.
"""


def _print_step(name: str, **data: object) -> None:
    print(json.dumps({"step": name, **data}, ensure_ascii=True, indent=2))


def _require_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required env var: {name}")
    return value


def _content_from_args(args: argparse.Namespace) -> bytes:
    if args.local_file:
        return Path(args.local_file).read_bytes()
    return DEFAULT_TEXT.encode("utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ai-url", default="http://127.0.0.1:8000")
    parser.add_argument("--bucket", default="document")
    parser.add_argument("--object-key")
    parser.add_argument("--file-name", default="quick-e2e.txt")
    parser.add_argument("--file-type", default="txt")
    parser.add_argument("--local-file", help="Upload this local file to MinIO before processing")
    parser.add_argument("--question", default="What is the project codename and what does it connect?")
    args = parser.parse_args()

    load_dotenv()

    user_id = str(uuid.uuid4())
    workspace_id = str(uuid.uuid4())
    document_id = str(uuid.uuid4())
    object_key = args.object_key or f"quick-e2e/{document_id}-{args.file_name}"
    content = _content_from_args(args)

    _print_step(
        "ids",
        user_id=user_id,
        workspace_id=workspace_id,
        document_id=document_id,
        bucket=args.bucket,
        object_key=object_key,
    )

    minio_client = Minio(
        _require_env("MINIO_ENDPOINT"),
        access_key=_require_env("MINIO_ACCESS_KEY"),
        secret_key=_require_env("MINIO_SECRET_KEY"),
        secure=os.getenv("MINIO_SECURE", "false").lower() == "true",
    )
    if not minio_client.bucket_exists(args.bucket):
        minio_client.make_bucket(args.bucket)
    minio_client.put_object(
        args.bucket,
        object_key,
        io.BytesIO(content),
        length=len(content),
        content_type="text/plain" if args.file_type in {"txt", "md", "markdown"} else "application/octet-stream",
    )
    _print_step("minio_upload", ok=True, bytes=len(content))

    conn = psycopg2.connect(_require_env("DATABASE_URL"))
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO users (id, google_id, email, full_name, system_role)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                user_id,
                f"quick-e2e-{user_id}",
                f"quick-e2e-{user_id}@example.test",
                "Quick E2E Tester",
                "user",
            ),
        )
        cur.execute(
            """
            INSERT INTO workspaces (id, owner_id, name, description)
            VALUES (%s, %s, %s, %s)
            """,
            (workspace_id, user_id, "Quick E2E Workspace", "Temporary AI dev test workspace"),
        )
        cur.execute(
            """
            INSERT INTO documents
                (id, workspace_id, uploaded_by_id, file_name, original_file_name, file_type, mime_type,
                 file_size_bytes, minio_bucket, minio_object_key, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                document_id,
                workspace_id,
                user_id,
                args.file_name,
                args.file_name,
                args.file_type,
                "text/plain",
                len(content),
                args.bucket,
                object_key,
                "uploaded",
            ),
        )
    _print_step("db_seed", ok=True)

    process_payload = {
        "document_id": document_id,
        "workspace_id": workspace_id,
        "folder_id": None,
        "minio_bucket": args.bucket,
        "minio_object_key": object_key,
        "file_type": args.file_type,
        "file_name": args.file_name,
    }
    response = requests.post(f"{args.ai_url}/process-document", json=process_payload, timeout=180)
    process_body = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
    _print_step("process_document", status_code=response.status_code, body=process_body)
    response.raise_for_status()

    with conn.cursor() as cur:
        cur.execute(
            "SELECT count(*), min(token_count), max(token_count) FROM document_chunks WHERE document_id = %s",
            (document_id,),
        )
        row = cur.fetchone()
        chunk_count, min_tokens, max_tokens = row if row and row[0] else (0, None, None)
    _print_step("db_chunks", chunk_count=chunk_count, min_tokens=min_tokens, max_tokens=max_tokens)

    rag_payload = {
        "question": args.question,
        "workspace_id": workspace_id,
        "scope": "document",
        "folder_id": None,
        "document_ids": [document_id],
        "top_k": 5,
        "chat_history": [],
    }
    response = requests.post(f"{args.ai_url}/rag/query", json=rag_payload, timeout=180)
    rag_body = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
    _print_step("rag_query", status_code=response.status_code, body=rag_body)

    report_payload = {
        "workspace_id": workspace_id,
        "document_ids": [document_id],
        "report_type": "summary_report",
        "custom_prompt": None,
    }
    response = requests.post(f"{args.ai_url}/generate-report", json=report_payload, timeout=180)
    report_body = response.json() if response.headers.get("content-type", "").startswith("application/json") else response.text
    if isinstance(report_body, dict) and "markdown_content" in report_body:
        report_body = {
            "report_type": report_body.get("report_type"),
            "markdown_preview": report_body.get("markdown_content", "")[:700],
        }
    _print_step("generate_report", status_code=response.status_code, body=report_body)

    _print_step("done", ok=True, workspace_id=workspace_id, document_id=document_id)
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        _print_step("error", error=str(exc))
        raise
