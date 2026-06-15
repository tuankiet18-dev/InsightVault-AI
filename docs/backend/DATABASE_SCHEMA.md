# InsightVault Database Schema

This document describes the current PostgreSQL schema and the intended data ownership rules for the backend.

## Design Principles

- `Workspace` is the top-level tenant boundary.
- `Folder` and `Document` belong to exactly one workspace.
- Active folder names are unique among sibling folders with the same parent in the same workspace.
- Active document file names are unique inside the same folder, including root-level documents where `folder_id IS NULL`.
- `ChatSession` belongs to one workspace and does not carry folder/document scope.
- `ChatMessageContext` stores per-message `@folder` and `@file` mentions.
- `ChatMessageSource.document_id` is nullable so hard-deleting a document preserves historical chat messages and citation snapshots.
- User-facing delete for `Folder` and `Document` is soft delete through `deleted_at`.
- Historical chat context uses snapshot fields and nullable resource references so approved Trash purge is not blocked by old chat history.

## Core Hierarchy

```text
users
  -> workspaces
    -> workspace_invitations
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

## Workspace Invitations

`workspace_invitations` stores GitHub-like pending workspace invitations.

Important columns:

- `id`
- `workspace_id`
- `invited_user_id`
- `email`
- `role`
- `status`: `Pending`, `Accepted`, `Declined`, `Expired`, or `Cancelled`
- `token_hash` reserved for future token-link flow; nullable in the current implementation
- `expires_at`
- `invited_by_id`
- `accepted_at`
- `declined_at`
- `cancelled_at`
- `created_at`
- `updated_at`

Rules:

- Invitations are tied to one existing active user through `invited_user_id`.
- Active workspace membership is not created until the invitation is accepted.
- Accept creates or reactivates `workspace_members` with `Status = Active`.
- Decline does not create a workspace member.
- Pending invitations do not grant access to workspace content.
- A filtered unique index prevents more than one pending invite for the same workspace/user pair.
- Workspace membership remains the permission source for workspace content.

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

`chat_message_contexts` stores the explicit context selected by the user in a single message, usually from `@folder` or `@file`.

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

- If `context_type = Folder`, `document_id` must be null. `folder_id` may later become null after hard delete because `context_display_name` and `context_path` preserve the historical snapshot.
- If `context_type = Document`, `folder_id` must be null. `document_id` may later become null after hard delete because `context_display_name` and `context_path` preserve the historical snapshot.
- `workspace_id` must match the parent chat message.
- New folder/document references must belong to the same workspace. The application validates this on write; the database keeps nullable resource references so hard delete can preserve chat history snapshots.
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

Hard delete is an explicit Trash operation. A workspace Owner may purge any document in the workspace; an Editor may purge only a document whose `uploaded_by_id` matches that Editor. A Viewer cannot purge documents. Historical chat context must retain snapshot display data or nullable references so it does not block an approved purge.

Required order for a document purge:

1. Verify the document is already in Trash.
2. Verify the caller is the workspace Owner, or an Editor whose user ID matches `uploaded_by_id`.
3. Detach or preserve historical chat references through snapshots.
4. Delete document chunks and the MinIO object.
5. Delete document metadata.

## Important Constraints

- `chat_sessions (id, workspace_id)` is an alternate key.
- `chat_messages (id, workspace_id)` is an alternate key.
- `folders (id, workspace_id)` is an alternate key.
- `documents (id, workspace_id)` is an alternate key.
- `chat_messages (chat_session_id, workspace_id)` references `chat_sessions (id, workspace_id)`.
- `chat_message_contexts (chat_message_id, workspace_id)` references `chat_messages (id, workspace_id)`.
- `chat_message_contexts.folder_id` references `folders.id` with `SET NULL`.
- `chat_message_contexts.document_id` references `documents.id` with `SET NULL`.
- `documents` has filtered unique indexes for active file names per folder:
  - `(workspace_id, folder_id, file_name)` where `folder_id IS NOT NULL AND deleted_at IS NULL`
  - `(workspace_id, file_name)` where `folder_id IS NULL AND deleted_at IS NULL`
- `documents` stores document intelligence output: `document_type`, `document_type_confidence`, `audience_fit`, and `insights` jsonb.
- `reports` has `report_group_id` and `version_number`; `(workspace_id, report_group_id, version_number)` is unique.

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
  folder_id
  document_id
    (chat_message_id, context_order)
    (chat_message_id, context_type, folder_id) [unique, note: 'folder_id IS NOT NULL']
    (chat_message_id, context_type, document_id) [unique, note: 'document_id IS NOT NULL']
  }

  Note: '''
  Check:
  (context_type = 'Folder' AND document_id IS NULL)
  OR
  (context_type = 'Document' AND folder_id IS NULL)
  Folder/document ids are nullable after hard delete; snapshot display fields preserve chat history.
  '''
}

Ref: chat_sessions.workspace_id > workspaces.id [delete: cascade]
Ref: chat_sessions.created_by_id > users.id [delete: set null]
Ref: chat_messages.(chat_session_id, workspace_id) > chat_sessions.(id, workspace_id) [delete: cascade]
Ref: chat_message_contexts.(chat_message_id, workspace_id) > chat_messages.(id, workspace_id) [delete: cascade]
Ref: chat_message_contexts.folder_id > folders.id [delete: set null]
Ref: chat_message_contexts.document_id > documents.id [delete: set null]
```

For the full schema, use the EF Core model in `backend/InsightVault.API/Data/InsightVaultDbContext.cs` as the source of truth.
