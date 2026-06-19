import { http } from './http'
import type { UserDashboardDto } from '@/types/api'

export const dashboardApi = {
  getWorkspaceStats: () => http.get<UserDashboardDto>('/workspaces/dashboard-stats'),
}
