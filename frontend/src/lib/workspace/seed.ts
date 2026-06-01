import type { DocumentItem, Folder, Workspace } from "./types";

export const seedWorkspaces: Workspace[] = [
  { id: "ws-1", name: "InsightVault Demo" },
  { id: "ws-2", name: "Capstone 2026" },
];

export const seedFolders: Folder[] = [
  { id: "f-1", name: "Proposals" },
  { id: "f-2", name: "Requirements" },
  { id: "f-3", name: "Research" },
];

export const seedDocuments: DocumentItem[] = [
  {
    id: "d-1",
    name: "Project Proposal v3.pdf",
    type: "pdf",
    status: "completed",
    folderId: "f-1",
    updatedAt: "2026-05-20",
    content: `# Project Proposal v3

## Objectives
- Build a collaborative AI-powered knowledge workspace.
- Reduce time-to-insight from scattered documents.

## Scope
The MVP includes shared workspaces, document upload, RAG-based Q&A, document
comparison and Markdown report generation.

## Success Metrics
- < 30s to first answer on a 50-page corpus.
- 80% of users prefer AI summary over raw reading.
`,
  },
  {
    id: "d-2",
    name: "MVP Requirements.docx",
    type: "docx",
    status: "completed",
    folderId: "f-2",
    updatedAt: "2026-05-22",
    content: `# MVP Requirements

## Authentication
- Google OAuth only.
- Internal JWT for API calls.

## Workspace
- Owner / Editor / Viewer roles.
- Folder + document tree.

## AI
- Summary, Ask (RAG), Compare, Report.
`,
  },
  {
    id: "d-3",
    name: "Meeting Notes 2026-05-28.md",
    type: "md",
    status: "processing",
    folderId: "f-2",
    updatedAt: "2026-05-28",
    content: `# Meeting Notes\n\nDocument is being processed...`,
  },
  {
    id: "d-4",
    name: "RAG Survey.pdf",
    type: "pdf",
    status: "completed",
    folderId: "f-3",
    updatedAt: "2026-04-15",
    content: `# RAG Survey

Retrieval-Augmented Generation combines a retriever and a generator to
ground answers in source documents. Common stacks pair a vector index
(pgvector, FAISS) with an LLM such as Gemini or GPT.
`,
  },
  {
    id: "d-5",
    name: "old-architecture.txt",
    type: "txt",
    status: "failed",
    folderId: "f-3",
    updatedAt: "2026-05-10",
    content: `Processing failed. Click retry to try again.`,
  },
  {
    id: "d-6",
    name: "Draft Report.md",
    type: "md",
    status: "uploaded",
    folderId: "f-1",
    updatedAt: "2026-05-29",
    content: `# Draft Report\n\nNot yet processed.`,
  },
];
