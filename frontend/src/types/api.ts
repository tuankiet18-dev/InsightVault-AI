// Shared Enums / Union Types
export type SystemRole = "user" | "admin";
export type WorkspaceRole = "owner" | "editor" | "viewer";
export type MemberStatus = "invited" | "active" | "removed";
export type WorkspaceInvitationStatus = "pending" | "accepted" | "declined" | "expired" | "cancelled";
export type DocumentStatus = "pending_upload" | "uploaded" | "processing" | "completed" | "failed";
export type DocumentType =
  | "prd"
  | "mvp_spec"
  | "business_proposal"
  | "meeting_note"
  | "technical_doc"
  | "project_report"
  | "cv_profile"
  | "research_note"
  | "internal_knowledge"
  | "general_document";
export type AiJobType =
  | "process_document"
  | "generate_summary"
  | "rag_chat"
  | "generate_report"
  | "compare_documents";
export type AiJobStatus = "queued" | "processing" | "completed" | "failed" | "cancelled";
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

export interface WorkspaceInvitationDto {
  id: string;
  workspaceId: string;
  workspaceName: string;
  invitedUserId: string;
  email: string;
  role: WorkspaceRole;
  status: WorkspaceInvitationStatus;
  invitedById?: string | null;
  invitedByName?: string | null;
  expiresAt: string;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  cancelledAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FolderDto {
  id: string;
  workspaceId: string;
  parentFolderId?: string | null;
  name: string;
  description?: string | null;
  createdById?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDto {
  id: string;
  workspaceId: string;
  folderId?: string | null;
  uploadedById?: string | null;
  fileName: string;
  originalFileName: string;
  fileType: string;
  mimeType?: string | null;
  fileSizeBytes: number;
  status: DocumentStatus;
  documentType?: DocumentType | string | null;
  documentTypeConfidence?: number | null;
  audienceFit?: string | null;
  summary?: string | null;
  keyPoints: string[];
  insights?: DocumentInsightsDto | null;
  keywords: string[];
  processingError?: string | null;
  processedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentInsightsDto {
  scope: string[];
  decisions: string[];
  risks: string[];
  gaps: string[];
  nextActions: string[];
}

export interface AiJobDto {
  id: string;
  workspaceId?: string | null;
  documentId?: string | null;
  reportId?: string | null;
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
  webSearchEnabled?: boolean;
  webSearchProvider?: "duckduckgo" | "searxng" | "brave" | null;
}

export interface ChatSessionDto {
  id: string;
  workspaceId: string;
  title?: string | null;
  webSearchEnabled?: boolean;
  webSearchProvider?: "duckduckgo" | "searxng" | "brave" | null;
  createdAt: string;
  updatedAt: string;
}

export type ChatContextType = "folder" | "document";

export interface ChatMessageContextRequest {
  contextType: ChatContextType;
  folderId?: string | null;
  documentId?: string | null;
  includeSubfolders?: boolean;
}

export interface ChatMessageContextDto {
  contextType: ChatContextType;
  folderId?: string | null;
  documentId?: string | null;
  includeSubfolders: boolean;
  contextDisplayName?: string | null;
  contextPath?: string | null;
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
  contexts: ChatMessageContextDto[];
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

export type DocumentOriginalPreviewKind = "pdf" | "text" | "download";

export interface DocumentOriginalAccessResponse {
  fileName: string;
  contentType: string;
  previewKind: DocumentOriginalPreviewKind;
  canPreviewInline: boolean;
  downloadUrl: string;
  expiresAt: string;
}

export interface DocumentOriginalTextResponse {
  fileName: string;
  contentType: string;
  content: string;
}

// Billing
export interface BillingPlanDto {
  code: string;
  name: string;
  description: string;
  priceVnd: number;
  billingPeriodMonths: number;
  includedCredits: number;
  maxMembers: number;
  storageLimitBytes: number;
}

export interface CreditPackageDto {
  code: string;
  name: string;
  priceVnd: number;
  credits: number;
}

export interface BillingSummaryDto {
  workspaceId: string;
  plan: BillingPlanDto;
  status: string;
  recurringCreditsRemaining: number;
  topUpCreditsRemaining: number;
  totalCreditsRemaining: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface CreateCheckoutRequest {
  productCode: string;
}

export interface CheckoutSessionDto {
  paymentOrderId: string;
  orderCode: number;
  productCode: string;
  amountVnd: number;
  checkoutUrl: string;
  expiresAt?: string | null;
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
export interface AdminDashboardDto {
  workspaceCount: number;
  userCount: number;
  documentCount: number;
  reportCount: number;
  aiJobCount: number;
}
