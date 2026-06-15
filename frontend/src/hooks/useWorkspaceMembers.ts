import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspaceApi } from '@/api/workspaceApi'
import type { AddMemberData, UpdateMemberData } from '@/api/workspaceApi'
import type { WorkspaceInvitationDto, WorkspaceMemberDto } from '@/types/api'
import type { ApiError } from '@/api/http'
import { toast } from 'sonner'

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

  return useMutation<WorkspaceInvitationDto, ApiError, AddMemberData>({
    mutationFn: (data: AddMemberData) => workspaceApi.addMember(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) })
      toast.success('Invitation sent successfully')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to send invitation')
    }
  })
}

export function useUpdateWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation<WorkspaceMemberDto, ApiError, { memberId: string; data: UpdateMemberData }>({
    mutationFn: ({ memberId, data }) => workspaceApi.updateMember(workspaceId, memberId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) })
      toast.success('Member role updated')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update member role')
    }
  })
}

export function useRemoveWorkspaceMember(workspaceId: string) {
  const queryClient = useQueryClient()

  return useMutation<void, ApiError, string>({
    mutationFn: (memberId: string) => workspaceApi.removeMember(workspaceId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.members(workspaceId) })
      toast.success('Member removed from workspace')
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to remove member')
    }
  })
}
