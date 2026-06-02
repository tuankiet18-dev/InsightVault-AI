import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi } from '@/api/workspaceApi'
import type { AddMemberData } from '@/api/workspaceApi'
import type { WorkspaceMemberDto } from '@/types/api'
import type { ApiError } from '@/api/http'

export const workspaceKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceKeys.all, 'list'] as const,
  list: (query?: string) => [...workspaceKeys.lists(), { query }] as const,
  details: () => [...workspaceKeys.all, 'detail'] as const,
  detail: (id: string) => [...workspaceKeys.details(), id] as const,
  members: (workspaceId: string) => [...workspaceKeys.detail(workspaceId), 'members'] as const,
}

export function useWorkspaceMembers(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: workspaceKeys.members(workspaceId!),
    queryFn: () => workspaceApi.getMembers(workspaceId!),
    enabled: !!workspaceId,
  })
}

export function useAddWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation<WorkspaceMemberDto, ApiError, AddMemberData>({
    mutationFn: (data: AddMemberData) => workspaceApi.addMember(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) })
    },
  })
}
