export type StatusTone = 'success' | 'warning' | 'danger'

export type DashboardStat = {
  label: string
  value: string
  detail: string
}

export type DocumentStatus = {
  label: string
  count: number
  tone: StatusTone
  description: string
}

export type WorkspaceAction = {
  title: string
  description: string
}

export type ActivityItem = {
  title: string
  detail: string
}
