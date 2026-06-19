import { http } from './http'
import type { WorkspaceSearchResultDto } from '@/types/api'

export const searchApi = {
  searchWorkspace: (workspaceId: string, q: string) => {
    return http.get<WorkspaceSearchResultDto[]>(`/workspaces/${workspaceId}/search`, {
      params: { q },
    })
  },
}
