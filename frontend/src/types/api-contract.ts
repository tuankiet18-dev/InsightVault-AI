export type SystemRole = 'user' | 'admin'
export type WorkspaceRole = 'owner' | 'editor' | 'viewer'
export type MemberStatus = 'invited' | 'active' | 'removed'
export type WorkspaceInvitationStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled'
export type DocumentStatus =
  | 'pending_upload'
  | 'uploaded'
  | 'processing'
  | 'completed'
  | 'failed'
export type DocumentType =
  | 'prd'
  | 'mvp_spec'
  | 'business_proposal'
  | 'meeting_note'
  | 'technical_doc'
  | 'project_report'
  | 'cv_profile'
  | 'research_note'
  | 'internal_knowledge'
  | 'general_document'
export type AiJobType =
  | 'process_document'
  | 'generate_summary'
  | 'rag_chat'
  | 'generate_report'
  | 'compare_documents'
export type AiJobStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled'
export type ChatMessageRole = 'user' | 'assistant'
export type ReportType =
  | 'summary_report'
  | 'comparison_report'
  | 'gap_analysis_report'
  | 'gap_conflict_report'
  | 'folder_report'
  | 'section_report'
  | 'custom_report'
export type WebSearchProvider = 'duckduckgo' | 'searxng' | 'brave'

export type ApiError = {
  errorCode: string
  message: string
  details?: unknown
}

export type UserDto = {
  id: string
  email: string
  fullName: string
  avatarUrl?: string | null
  systemRole: SystemRole
  isActive: boolean
  lastLoginAt?: string | null
}

export type WorkspaceDto = {
  id: string
  ownerId: string
  name: string
  description?: string | null
  isArchived: boolean
  currentUserRole: WorkspaceRole
  createdAt: string
  updatedAt: string
}

export type WorkspaceMemberDto = {
  id: string
  workspaceId: string
  userId?: string | null
  email: string
  role: WorkspaceRole
  status: MemberStatus
  invitedById?: string | null
  invitedAt: string
  joinedAt?: string | null
}

export type WorkspaceInvitationDto = {
  id: string
  workspaceId: string
  workspaceName: string
  invitedUserId: string
  email: string
  role: WorkspaceRole
  status: WorkspaceInvitationStatus
  invitedById?: string | null
  invitedByName?: string | null
  expiresAt: string
  acceptedAt?: string | null
  declinedAt?: string | null
  cancelledAt?: string | null
  createdAt: string
  updatedAt: string
}

export type FolderDto = {
  id: string
  workspaceId: string
  parentFolderId?: string | null
  name: string
  description?: string | null
  createdAt: string
  updatedAt: string
}

export type DocumentDto = {
  id: string
  workspaceId: string
  folderId?: string | null
  fileName: string
  originalFileName: string
  fileType: string
  mimeType?: string | null
  fileSizeBytes: number
  status: DocumentStatus
  documentType?: DocumentType | string | null
  documentTypeConfidence?: number | null
  audienceFit?: string | null
  summary?: string | null
  keyPoints: string[]
  insights?: DocumentInsightsDto | null
  keywords: string[]
  processingError?: string | null
  processedAt?: string | null
  createdAt: string
  updatedAt: string
}

export type DocumentInsightsDto = {
  scope: string[]
  decisions: string[]
  risks: string[]
  gaps: string[]
  nextActions: string[]
}

export type AiJobDto = {
  id: string
  workspaceId?: string | null
  documentId?: string | null
  jobType: AiJobType
  status: AiJobStatus
  retryCount: number
  errorMessage?: string | null
  createdAt: string
  updatedAt: string
}

export type PresignUploadRequest = {
  folderId?: string | null
  fileName: string
  fileSizeBytes: number
  contentType: string
}

export type PresignUploadResponse = {
  documentId: string
  uploadUrl: string
  objectKey: string
  expiresAt: string
  requiredHeaders: Record<string, string>
}

export type ConfirmUploadRequest = {
  fileSizeBytes: number
  contentType: string
}

export type ConfirmUploadResponse = {
  document: DocumentDto
  aiJob: AiJobDto
}

export type WebSearchOptions = {
  enabled?: boolean
  provider?: WebSearchProvider | null
  maxResults?: number
}

export type CreateChatSessionRequest = {
  title?: string | null
  webSearchEnabled?: boolean
  webSearchProvider?: WebSearchProvider | null
}

export type ChatSessionDto = {
  id: string
  workspaceId: string
  title?: string | null
  webSearchEnabled?: boolean
  webSearchProvider?: WebSearchProvider | null
  createdAt: string
  updatedAt: string
}

export type ChatContextType = 'folder' | 'document' | 'report'

export type ChatMessageContextRequest = {
  contextType: ChatContextType
  folderId?: string | null
  documentId?: string | null
  reportId?: string | null
  includeSubfolders?: boolean
}

export type ChatMessageContextDto = {
  contextType: ChatContextType
  folderId?: string | null
  documentId?: string | null
  reportId?: string | null
  includeSubfolders: boolean
  contextDisplayName?: string | null
  contextPath?: string | null
}

export type ChatSourceDto = {
  documentId: string
  documentChunkId?: string | null
  fileName: string
  snippet: string
  similarity?: number | null
  chunkIndex?: number | null
  pageNumber?: number | null
}

export type WebSourceDto = {
  title: string
  url: string
  snippet?: string | null
  provider?: string | null
}

export type ChatMessageDto = {
  id: string
  chatSessionId: string
  role: ChatMessageRole
  content: string
  modelName?: string | null
  contexts: ChatMessageContextDto[]
  sources: ChatSourceDto[]
  webSources?: WebSourceDto[]
  createdAt: string
}

export type SendChatMessageRequest = {
  content: string
  contexts?: ChatMessageContextRequest[]
  webSearchOptions?: WebSearchOptions
}

export type ChatTurnResponse = {
  userMessage: ChatMessageDto
  assistantMessage: ChatMessageDto
}

export type CompareDocumentsRequest = {
  folderId?: string | null
  documentIds: string[]
  title?: string | null
  storeReport?: boolean
  webSearchOptions?: WebSearchOptions
}

export type CompareDocumentsResponse = {
  objectives: string
  scope: string
  similarities: string[]
  differences: string[]
  missingInformation: string[]
  potentialConflicts: string[]
  recommendations: string[]
  rawMarkdown: string
  reportId?: string | null
}

export type GenerateReportRequest = {
  folderId?: string | null
  documentIds: string[]
  reportType: ReportType
  title?: string | null
  customPrompt?: string | null
  storeReport?: boolean
  webSearchOptions?: WebSearchOptions
}

export type ReportDto = {
  id: string
  workspaceId: string
  folderId?: string | null
  title: string
  reportType: ReportType
  markdownContent: string
  sourceDocuments: string[]
  structuredResult: unknown
  modelName?: string | null
  createdAt: string
  updatedAt: string
}

export type UserDashboardDto = {
  workspaceCount: number
  folderCount: number
  documentCount: number
  completedDocumentCount: number
  processingDocumentCount: number
  failedDocumentCount: number
  reportCount: number
  recentJobs: AiJobDto[]
}
