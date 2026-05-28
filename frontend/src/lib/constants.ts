export const APP_NAME = 'InsightVault AI'
export const APP_DESCRIPTION = 'Collaborative AI Knowledge Workspace'

export const FILE_TYPES_ACCEPTED = ['.pdf', '.docx', '.doc', '.txt', '.md', '.markdown']
export const MAX_FILE_SIZE_MB = 50
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1200,
  desktop: 1440,
} as const

export const EXPLORER_WIDTH = 280
export const INSPECTOR_WIDTH = 340
export const RAIL_WIDTH = 48
export const TOPBAR_HEIGHT = 48
export const TABSTRIP_HEIGHT = 36
export const STATUSBAR_HEIGHT = 24

export const AI_MODES = ['Ask', 'Compare', 'Gap', 'Report'] as const
export type AiMode = typeof AI_MODES[number]

export const SCOPE_OPTIONS = ['Workspace', 'Folder', 'Document'] as const

export const NAV_ITEMS = [
  { id: 'explorer', label: 'Explorer', path: '/' },
  { id: 'search', label: 'Search', path: '/' },
  { id: 'chat', label: 'AI Chat', path: '/chat' },
  { id: 'reports', label: 'Reports', path: '/reports' },
  { id: 'admin', label: 'Admin', path: '/admin' },
] as const
