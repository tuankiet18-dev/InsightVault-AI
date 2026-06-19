import { http } from './http';
import type { UserDashboardDto, UserDto, AiJobDto, AiJobStatus, AiJobType } from '../types/api';

export interface UpdateUserData {
  isActive?: boolean;
  systemRole?: 'user' | 'admin';
}

export interface AdminUserDetailDto {
  user: UserDto;
  ownedWorkspaceCount: number;
  memberWorkspaceCount: number;
  uploadedDocumentCount: number;
  storageBytes: number;
  aiCreditsRemaining: number;
  paymentOrderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAiJobDetailDto {
  job: AiJobDto;
  createdById?: string | null;
  createdByEmail?: string | null;
  inputPayload: string;
  outputPayload: string;
  errorMessage?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
}

export interface AdminWorkspaceDto {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  ownerEmail: string;
  isArchived: boolean;
  memberCount: number;
  documentCount: number;
  storageBytes: number;
  reportCount: number;
  aiJobCount: number;
  planName?: string | null;
  aiCreditsRemaining: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface AdminPaymentOrderDto {
  id: string;
  workspaceId: string;
  workspaceName: string;
  createdById: string;
  createdByEmail: string;
  purchaseType: string;
  status: string;
  provider: string;
  amountVnd: number;
  paidAt?: string | null;
  createdAt: string;
}

export interface AdminSubscriptionPlanDto {
  id: string;
  code: string;
  name: string;
  description: string;
  priceVnd: number;
  billingPeriodMonths: number;
  includedCredits: number;
  maxMembers: number;
  storageLimitBytes: number;
  isActive: boolean;
  displayOrder: number;
}

export interface AdminCreditPackageDto {
  id: string;
  code: string;
  name: string;
  priceVnd: number;
  credits: number;
  isActive: boolean;
  displayOrder: number;
}

export interface AdminBillingOverviewDto {
  totalRevenueVnd: number;
  paidRevenueVnd: number;
  paymentOrderCount: number;
  paidOrderCount: number;
  pendingOrderCount: number;
  activeSubscriptionCount: number;
  recentOrders: AdminPaymentOrderDto[];
  plans: AdminSubscriptionPlanDto[];
  creditPackages: AdminCreditPackageDto[];
}

export interface AdminSystemSettingsDto {
  aiServiceBaseUrl: string;
  defaultAiModel: string;
  defaultWorkspaceCredits: number;
  webSearchEnabled: boolean;
  smtpEnabled: boolean;
  payOsEnabled: boolean;
  persisted: boolean;
}

export const adminApi = {
  // Dashboard (for current user)
  getDashboard: () => {
    return http.get<UserDashboardDto>('/dashboard/me');
  },

  // Admin User Management
  getUsers: (q?: string, isActive?: boolean, role?: 'user' | 'admin') => {
    return http.get<UserDto[]>('/admin/users', { params: { q, isActive, role } });
  },

  getUserDetail: (userId: string) => {
    return http.get<AdminUserDetailDto>(`/admin/users/${userId}`);
  },

  updateUser: (userId: string, data: UpdateUserData) => {
    return http.patch<UserDto>(`/admin/users/${userId}`, data);
  },

  deleteUser: (userId: string) => {
    return http.delete<void>(`/admin/users/${userId}`);
  },

  // Admin AI Job Management
  getAllAiJobs: (status?: AiJobStatus, type?: AiJobType) => {
    return http.get<AiJobDto[]>('/admin/ai-jobs', { params: { status, type } });
  },

  getAiJobDetail: (jobId: string) => {
    return http.get<AdminAiJobDetailDto>(`/admin/ai-jobs/${jobId}`);
  },

  retryAiJob: (jobId: string) => {
    return http.post<AiJobDto>(`/admin/ai-jobs/${jobId}/retry`);
  },

  cancelAiJob: (jobId: string) => {
    return http.post<AiJobDto>(`/admin/ai-jobs/${jobId}/cancel`);
  },

  getWorkspaces: (q?: string, includeDeleted = false) => {
    return http.get<AdminWorkspaceDto[]>('/admin/workspaces', { params: { q, includeDeleted } });
  },

  getBilling: () => {
    return http.get<AdminBillingOverviewDto>('/admin/billing');
  },

  updatePlan: (planId: string, data: Partial<AdminSubscriptionPlanDto>) => {
    return http.patch<AdminSubscriptionPlanDto>(`/admin/billing/plans/${planId}`, data);
  },

  updateCreditPackage: (packageId: string, data: Partial<AdminCreditPackageDto>) => {
    return http.patch<AdminCreditPackageDto>(`/admin/billing/credit-packages/${packageId}`, data);
  },

  getSettings: () => {
    return http.get<AdminSystemSettingsDto>('/admin/settings');
  },

  updateSettings: (data: Partial<AdminSystemSettingsDto>) => {
    return http.patch<AdminSystemSettingsDto>('/admin/settings', data);
  },
};
