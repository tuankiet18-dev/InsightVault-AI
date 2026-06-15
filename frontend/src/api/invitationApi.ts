import { http } from './http';
import type { WorkspaceInvitationDto, WorkspaceRole } from '@/types/api';

export interface CreateWorkspaceInvitationData {
  email: string;
  role: WorkspaceRole;
}

export const invitationApi = {
  createWorkspaceInvitation: (workspaceId: string, data: CreateWorkspaceInvitationData) => {
    return http.post<WorkspaceInvitationDto>(`/workspaces/${workspaceId}/invitations`, data);
  },

  getWorkspaceInvitations: (workspaceId: string) => {
    return http.get<WorkspaceInvitationDto[]>(`/workspaces/${workspaceId}/invitations`);
  },

  getMyInvitations: () => {
    return http.get<WorkspaceInvitationDto[]>('/me/workspace-invitations');
  },

  getMyInvitation: (invitationId: string) => {
    return http.get<WorkspaceInvitationDto>(`/me/workspace-invitations/${invitationId}`);
  },

  acceptInvitation: (invitationId: string) => {
    return http.post<WorkspaceInvitationDto>(`/me/workspace-invitations/${invitationId}/accept`);
  },

  declineInvitation: (invitationId: string) => {
    return http.post<WorkspaceInvitationDto>(`/me/workspace-invitations/${invitationId}/decline`);
  },
};
