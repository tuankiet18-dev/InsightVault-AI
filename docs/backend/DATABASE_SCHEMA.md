# InsightVault Database Schema

This document describes the current PostgreSQL schema and the intended data ownership rules for the backend.

## Design Principles

- `Workspace` is the top-level tenant boundary.
- `Folder` and `Document` belong to exactly one workspace.
- Active folder names are unique within the same workspace, regardless of parent folder.
- `ChatSession` belongs to one workspace and does not carry folder/document scope.
- `ChatMessageContext` stores per-message `@folder` and `@document` mentions.
- User-facing delete for `Folder` and `Document` is soft delete through `deleted_at`.
- Hard delete is intentionally restricted when chat history still references the resource.

## Core Hierarchy

```text
users
  -> workspaces
    -> folders
      -> documents
        -> document_chunks
    -> chat_sessions
      -> chat_messages
        -> chat_message_contexts
        -> chat_message_sources
    -> reports
    -> ai_jobs
```

## Chat And RAG Model

`chat_sessions` represents a conversation inside a workspace.

Important columns:

- `id`
- `workspace_id`
- `created_by_id`
- `title`
- `created_at`
- `updated_at`
- `deleted_at`

There is no session-level folder or document scope. A session can ask over the whole workspace by default.

`chat_messages` stores each user/assistant/system message.

Important columns:

- `id`
- `workspace_id`
- `chat_session_id`
- `role`
- `content`
- `model_name`
- token/latency metadata
- `created_at`

`workspace_id` is denormalized from `chat_sessions.workspace_id`. This is intentional: it allows the database to enforce same-workspace constraints for message contexts.

`chat_message_contexts` stores the explicit context selected by the user in a single message, usually from `@folder` or `@document`.

Important columns:

- `id`
- `workspace_id`
- `chat_message_id`
- `context_type`: `Folder` or `Document`
- `folder_id`
- `document_id`
- `include_subfolders`
- `context_order`
- `context_display_name`
- `context_path`
- `created_at`

Rules:

- If `context_type = Folder`, `folder_id` is required and `document_id` must be null.
- If `context_type = Document`, `document_id` is required and `folder_id` must be null.
- `workspace_id` must match the parent chat message.
- Folder/document references must belong to the same workspace.
- Duplicate folder/document contexts in one message are rejected by unique indexes.
- `context_display_name` and `context_path` are snapshots for readable chat history after rename or soft delete.

RAG behavior:

- Message without contexts: retrieve across the whole workspace.
- Message with document contexts: retrieve only those documents.
- Message with folder contexts: retrieve documents in the selected folder, optionally including subfolders.

## Delete Policy

Folder/document user deletes are soft deletes:

- `folders.deleted_at`
- `documents.deleted_at`

Soft-deleted resources are hidden from normal list/detail APIs and from future RAG retrieval.

Hard delete is a database maintenance operation only. It is restricted when chat history still references the resource through `chat_message_contexts`. This prevents historical conversations from silently losing their context.

Recommended maintenance order for true purges:

1. Decide whether chat history must be retained.
2. Export or anonymize chat history if needed.
3. Delete dependent chat context/source rows explicitly.
4. Delete document chunks/object storage.
5. Delete document/folder rows.

## Important Constraints

- `chat_sessions (id, workspace_id)` is an alternate key.
- `chat_messages (id, workspace_id)` is an alternate key.
- `folders (id, workspace_id)` is an alternate key.
- `documents (id, workspace_id)` is an alternate key.
- `chat_messages (chat_session_id, workspace_id)` references `chat_sessions (id, workspace_id)`.
- `chat_message_contexts (chat_message_id, workspace_id)` references `chat_messages (id, workspace_id)`.
- `chat_message_contexts (folder_id, workspace_id)` references `folders (id, workspace_id)` with hard-delete restrict.
- `chat_message_contexts (document_id, workspace_id)` references `documents (id, workspace_id)` with hard-delete restrict.

## DBML

```dbml
Table chat_sessions {
  id uuid [pk, default: `gen_random_uuid()`]
  workspace_id uuid [not null]
  created_by_id uuid
  title varchar(255)
  created_at timestamptz [not null, default: `now()`]
  updated_at timestamptz [not null, default: `now()`]
  deleted_at timestamptz

  indexes {
    (id, workspace_id) [unique]
    workspace_id
    created_by_id
    deleted_at
  }
}

Table chat_messages {
  id uuid [pk, default: `gen_random_uuid()`]
  workspace_id uuid [not null]
  chat_session_id uuid [not null]
  role varchar(50) [not null]
  content text [not null]
  model_name varchar(255)
  prompt_tokens int
  completion_tokens int
  latency_ms int
  metadata jsonb [not null, default: `'{}'::jsonb`]
  created_at timestamptz [not null, default: `now()`]

  indexes {
    (id, workspace_id) [unique]
    (chat_session_id, workspace_id)
    workspace_id
    created_at
  }
}

Table chat_message_contexts {
  id uuid [pk, default: `gen_random_uuid()`]
  workspace_id uuid [not null]
  chat_message_id uuid [not null]
  context_type varchar(50) [not null]
  folder_id uuid
  document_id uuid
  include_subfolders boolean [not null, default: true]
  context_order int [not null]
  context_display_name varchar(500)
  context_path varchar(2000)
  created_at timestamptz [not null, default: `now()`]

  indexes {
    workspace_id
    (chat_message_id, workspace_id)
    (folder_id, workspace_id)
    (document_id, workspace_id)
    (chat_message_id, context_order)
    (chat_message_id, context_type, folder_id) [unique, note: 'folder_id IS NOT NULL']
    (chat_message_id, context_type, document_id) [unique, note: 'document_id IS NOT NULL']
  }

  Note: '''
  Check:
  (context_type = 'Folder' AND folder_id IS NOT NULL AND document_id IS NULL)
  OR
  (context_type = 'Document' AND document_id IS NOT NULL AND folder_id IS NULL)
  '''
}

Ref: chat_sessions.workspace_id > workspaces.id [delete: cascade]
Ref: chat_sessions.created_by_id > users.id [delete: set null]
Ref: chat_messages.(chat_session_id, workspace_id) > chat_sessions.(id, workspace_id) [delete: cascade]
Ref: chat_message_contexts.(chat_message_id, workspace_id) > chat_messages.(id, workspace_id) [delete: cascade]
Ref: chat_message_contexts.(folder_id, workspace_id) > folders.(id, workspace_id) [delete: restrict]
Ref: chat_message_contexts.(document_id, workspace_id) > documents.(id, workspace_id) [delete: restrict]
```

For the full schema, use the EF Core model in `backend/InsightVault.API/Data/InsightVaultDbContext.cs` as the source of truth.
