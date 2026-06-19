import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboardApi'

export const dashboardStatsKeys = {
  all: ['dashboard-stats'] as const,
  me: () => [...dashboardStatsKeys.all, 'me'] as const,
}

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardStatsKeys.me(),
    queryFn: dashboardApi.getWorkspaceStats,
  })
}
