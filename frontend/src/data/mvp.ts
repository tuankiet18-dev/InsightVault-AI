import type { ActivityItem, DashboardStat, DocumentStatus, WorkspaceAction } from '../types/mvp'

export const dashboardStats: DashboardStat[] = [
  { label: 'Workspaces', value: '3', detail: '2 active projects' },
  { label: 'Documents', value: '42', detail: '31 AI-ready' },
  { label: 'Reports', value: '8', detail: 'Markdown outputs' },
  { label: 'AI jobs', value: '5', detail: '2 pending review' },
]

export const documentStatuses: DocumentStatus[] = [
  {
    label: 'Completed',
    count: 31,
    tone: 'success',
    description: 'Chunks, embeddings, and summaries are available.',
  },
  {
    label: 'Processing',
    count: 6,
    tone: 'warning',
    description: 'Extraction and embedding jobs are running.',
  },
  {
    label: 'Failed',
    count: 1,
    tone: 'danger',
    description: 'One upload needs retry after extraction error.',
  },
]

export const workspaceActions: WorkspaceAction[] = [
  {
    title: 'Invite member',
    description: 'Add users by email and assign owner, editor, or viewer role.',
  },
  {
    title: 'Ask workspace AI',
    description: 'Run RAG chat scoped to documents this workspace can access.',
  },
  {
    title: 'Compare documents',
    description: 'Find differences, missing details, and potential conflicts.',
  },
]

export const aiPipelineSteps = [
  'Read source file from MinIO',
  'Extract and clean text',
  'Split text into chunks',
  'Generate Gemini embeddings',
  'Store vectors in PostgreSQL pgvector',
  'Create summary, key points, and keywords',
]

export const activityItems: ActivityItem[] = [
  {
    title: 'Requirement document processed',
    detail: 'Summary and searchable chunks are ready.',
  },
  {
    title: 'Comparison report generated',
    detail: 'Proposal vs requirement gap analysis saved.',
  },
  {
    title: 'Admin reviewed failed job',
    detail: 'Retry queued for malformed PDF upload.',
  },
]
