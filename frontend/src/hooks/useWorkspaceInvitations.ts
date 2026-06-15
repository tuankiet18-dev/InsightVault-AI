import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invitationApi, type CreateWorkspaceInvitationData } from '@/api/invitationApi';
import type { ApiError } from '@/api/http';
import type { WorkspaceInvitationDto } from '@/types/api';

export const invitationKeys = {
  all: ['workspace-invitations'] as const,
  mine: () => [...invitationKeys.all, 'mine'] as const,
  mineDetail: (invitationId: string) => [...invitationKeys.mine(), invitationId] as const,
  workspace: (workspaceId: string) => [...invitationKeys.all, 'workspace', workspaceId] as const,
};

export function useMyWorkspaceInvitations() {
  return useQuery({
    queryKey: invitationKeys.mine(),
    queryFn: invitationApi.getMyInvitations,
  });
}

export function useMyWorkspaceInvitation(invitationId: string | null | undefined) {
  return useQuery({
    queryKey: invitationKeys.mineDetail(invitationId!),
    queryFn: () => invitationApi.getMyInvitation(invitationId!),
    enabled: !!invitationId,
  });
}

export function useWorkspaceInvitations(workspaceId: string | null | undefined) {
  return useQuery({
    queryKey: invitationKeys.workspace(workspaceId!),
    queryFn: () => invitationApi.getWorkspaceInvitations(workspaceId!),
    enabled: !!workspaceId,
  });
}

export function useCreateWorkspaceInvitation(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation<WorkspaceInvitationDto, ApiError, CreateWorkspaceInvitationData>({
    mutationFn: (data) => invitationApi.createWorkspaceInvitation(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.workspace(workspaceId) });
    },
  });
}

export function useAcceptWorkspaceInvitation() {
  const queryClient = useQueryClient();

  return useMutation<WorkspaceInvitationDto, ApiError, string>({
    mutationFn: invitationApi.acceptInvitation,
    onSuccess: (invitation) => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.mine() });
      queryClient.setQueryData(invitationKeys.mineDetail(invitation.id), invitation);
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useDeclineWorkspaceInvitation() {
  const queryClient = useQueryClient();

  return useMutation<WorkspaceInvitationDto, ApiError, string>({
    mutationFn: invitationApi.declineInvitation,
    onSuccess: (invitation) => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.mine() });
      queryClient.setQueryData(invitationKeys.mineDetail(invitation.id), invitation);
    },
  });
}
