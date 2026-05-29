import { http } from './http';
import type { UserDashboardDto, UserDto, AiJobDto, AiJobStatus, AiJobType } from '../types/api';

export interface UpdateUserData {
  isActive?: boolean;
  systemRole?: 'user' | 'admin';
}

export const adminApi = {
  // Dashboard (for current user)
  getDashboard: () => {
    return http.get<UserDashboardDto>('/dashboard/me');
  },

  // Admin User Management
  getUsers: (q?: string, isActive?: boolean) => {
    return http.get<UserDto[]>('/admin/users', { params: { q, isActive } });
  },

  updateUser: (userId: string, data: UpdateUserData) => {
    return http.patch<UserDto>(`/admin/users/${userId}`, data);
  },

  // Admin AI Job Management
  getAllAiJobs: (status?: AiJobStatus, type?: AiJobType) => {
    return http.get<AiJobDto[]>('/admin/ai-jobs', { params: { status, type } });
  },
};
