export type DocType = "pdf" | "docx" | "txt" | "md";
export type DocStatus = "uploaded" | "processing" | "completed" | "failed";
export type WorkspaceRole = "owner" | "editor" | "viewer";

export interface Citation {
  id: string;
  documentId: string;
  documentName: string;
  page?: number;
  snippet: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  type: DocType;
  status: DocStatus;
  folderId: string;
  content: string; // markdown
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
}

export interface Workspace {
  id: string;
  name: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
}
