import { http } from './http';
import type { WorkspaceDto, WorkspaceMemberDto, WorkspaceRole, MemberStatus, WorkspaceInvitationDto } from '../types/api';

export interface CreateWorkspaceData {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceData {
  name?: string;
  description?: string;
  isArchived?: boolean;
}

export interface AddMemberData {
  email: string;
  role: WorkspaceRole;
}

export interface UpdateMemberData {
  role?: WorkspaceRole;
  status?: MemberStatus;
}

export const workspaceApi = {
  // Workspace CRUD
  getWorkspaces: (query?: string) => {
    return http.get<WorkspaceDto[]>('/workspaces', { params: { q: query } });
  },

  createWorkspace: (data: CreateWorkspaceData) => {
    return http.post<WorkspaceDto>('/workspaces', data);
  },

  getWorkspace: (workspaceId: string) => {
    return http.get<WorkspaceDto>(`/workspaces/${workspaceId}`);
  },

  updateWorkspace: (workspaceId: string, data: UpdateWorkspaceData) => {
    return http.patch<WorkspaceDto>(`/workspaces/${workspaceId}`, data);
  },

  deleteWorkspace: (workspaceId: string) => {
    return http.delete<void>(`/workspaces/${workspaceId}`);
  },

  // Workspace Members
  getMembers: (workspaceId: string) => {
    return http.get<WorkspaceMemberDto[]>(`/workspaces/${workspaceId}/members`);
  },

  addMember: (workspaceId: string, data: AddMemberData) => {
    return http.post<WorkspaceInvitationDto>(`/workspaces/${workspaceId}/invitations`, data);
  },

  updateMember: (workspaceId: string, memberId: string, data: UpdateMemberData) => {
    return http.patch<WorkspaceMemberDto>(`/workspaces/${workspaceId}/members/${memberId}`, data);
  },

  removeMember: (workspaceId: string, memberId: string) => {
    return http.delete<void>(`/workspaces/${workspaceId}/members/${memberId}`);
  },
};
