import { useQuery } from '@tanstack/react-query'
import { searchApi } from '@/api/searchApi'

export const searchKeys = {
  all: ['search'] as const,
  workspace: (workspaceId: string, q: string) => [...searchKeys.all, workspaceId, q] as const,
}

export const useWorkspaceSearch = (workspaceId: string | null, q: string) => {
  const normalized = q.trim()

  return useQuery({
    queryKey: searchKeys.workspace(workspaceId ?? 'none', normalized),
    queryFn: () => searchApi.searchWorkspace(workspaceId!, normalized),
    enabled: !!workspaceId && normalized.length >= 2,
    staleTime: 30 * 1000,
  })
}
