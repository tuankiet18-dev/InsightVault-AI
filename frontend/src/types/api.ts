// Shared Enums / Union Types
export type SystemRole = "user" | "admin";
export type WorkspaceRole = "owner" | "editor" | "viewer";
export type MemberStatus = "invited" | "active" | "removed";
export type DocumentStatus = "pending_upload" | "uploaded" | "processing" | "completed" | "failed";
export type AiJobType =
  | "process_document"
  | "generate_summary"
  | "rag_chat"
  | "generate_report"
  | "compare_documents";
export type AiJobStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";
export type ChatScopeType = "workspace" | "folder" | "document";
export type ChatMessageRole = "user" | "assistant";
export type ReportType =
  | "summary_report"
  | "comparison_report"
  | "gap_analysis_report"
  | "gap_conflict_report"
  | "folder_report"
  | "section_report"
  | "custom_report";

// Core DTOs
export interface UserDto {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  systemRole: SystemRole;
  isActive: boolean;
  lastLoginAt?: string | null;
}

export interface WorkspaceDto {
  id: string;
  ownerId: string;
  name: string;
  description?: string | null;
  isArchived: boolean;
  currentUserRole: WorkspaceRole;
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMemberDto {
  id: string;
  workspaceId: string;
  userId?: string | null;
  email: string;
  role: WorkspaceRole;
  status: MemberStatus;
  invitedById?: string | null;
  invitedAt: string;
  joinedAt?: string | null;
}

export interface FolderDto {
  id: string;
  workspaceId: string;
  parentFolderId?: string | null;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDto {
  id: string;
  workspaceId: string;
  folderId?: string | null;
  fileName: string;
  originalFileName: string;
  fileType: string;
  mimeType?: string | null;
  fileSizeBytes: number;
  status: DocumentStatus;
  summary?: string | null;
  keyPoints: string[];
  keywords: string[];
  processingError?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiJobDto {
  id: string;
  workspaceId?: string | null;
  documentId?: string | null;
  jobType: AiJobType;
  status: AiJobStatus;
  retryCount: number;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Request & Response types

// Auth
export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: UserDto;
}

// Document Upload
export interface PresignUploadRequest {
  folderId?: string | null;
  fileName: string;
  fileSizeBytes: number;
  contentType: string;
}

export interface PresignUploadResponse {
  documentId: string;
  uploadUrl: string;
  objectKey: string;
  expiresAt: string;
  requiredHeaders: Record<string, string>;
}

export interface ConfirmUploadRequest {
  fileSizeBytes: number;
  contentType: string;
}

export interface ConfirmUploadResponse {
  document: DocumentDto;
  aiJob: AiJobDto;
}

// Chat
export interface CreateChatSessionRequest {
  title?: string | null;
  scopeType: ChatScopeType;
  scopeWorkspaceId?: string | null;
  scopeFolderId?: string | null;
  scopeDocumentIds?: string[];
  includeSubfolders?: boolean;
  webSearchEnabled?: boolean;
  webSearchProvider?: "duckduckgo" | "searxng" | "brave" | null;
}

export interface ChatSessionDto {
  id: string;
  workspaceId: string;
  title?: string | null;
  scopeType: ChatScopeType;
  scopeWorkspaceId?: string | null;
  scopeFolderId?: string | null;
  scopeDocumentIds?: string[];
  includeSubfolders: boolean;
  webSearchEnabled?: boolean;
  webSearchProvider?: "duckduckgo" | "searxng" | "brave" | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatSourceDto {
  documentId: string;
  documentChunkId?: string | null;
  fileName: string;
  snippet: string;
  similarity?: number | null;
}

export interface WebSourceDto {
  title: string;
  url: string;
  snippet?: string | null;
  provider?: string | null;
}

export interface ChatMessageDto {
  id: string;
  chatSessionId: string;
  role: ChatMessageRole;
  content: string;
  modelName?: string | null;
  sources: ChatSourceDto[];
  webSources?: WebSourceDto[];
  createdAt: string;
}

export interface ChatTurnResponse {
  userMessage: ChatMessageDto;
  assistantMessage: ChatMessageDto;
}

export interface WebSearchOptions {
  enabled?: boolean;
  provider?: "duckduckgo" | "searxng" | "brave" | null;
  maxResults?: number;
}

// Compare & Reports
export interface CompareRequest {
  folderId?: string | null;
  documentIds: string[];
  title?: string | null;
  storeReport?: boolean;
  webSearchOptions?: WebSearchOptions;
}

export interface CompareResponse {
  objectives: string;
  scope: string;
  similarities: string[];
  differences: string[];
  missingInformation: string[];
  potentialConflicts: string[];
  recommendations: string[];
  rawMarkdown: string;
  reportId?: string | null;
}

export interface GenerateReportRequest {
  folderId?: string | null;
  documentIds: string[];
  reportType: ReportType;
  title?: string | null;
  customPrompt?: string | null;
  storeReport?: boolean;
  webSearchOptions?: WebSearchOptions;
}

export interface ReportDto {
  id: string;
  workspaceId: string;
  folderId?: string | null;
  title: string;
  reportType: ReportType;
  markdownContent: string;
  sourceDocuments: string[];
  structuredResult: unknown;
  modelName?: string | null;
  createdAt: string;
  updatedAt: string;
}

// Dashboard
export interface UserDashboardDto {
  workspaceCount: number;
  folderCount: number;
  documentCount: number;
  completedDocumentCount: number;
  processingDocumentCount: number;
  failedDocumentCount: number;
  reportCount: number;
  recentJobs: AiJobDto[];
}
