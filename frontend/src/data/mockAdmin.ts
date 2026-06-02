import type { UserDto } from '@/types/api-contract'
import type { AdminMetric } from '@/types/ui'

export const mockCurrentUser: UserDto = {
  id: 'user-001',
  email: 'minh.nguyen@fpt.edu.vn',
  fullName: 'Minh Nguyen',
  avatarUrl: null,
  systemRole: 'user',
  isActive: true,
  lastLoginAt: '2026-05-28T08:00:00Z',
}

export const mockUsers: UserDto[] = [
  {
    id: 'user-001',
    email: 'minh.nguyen@fpt.edu.vn',
    fullName: 'Minh Nguyen',
    avatarUrl: null,
    systemRole: 'user',
    isActive: true,
    lastLoginAt: '2026-05-28T08:00:00Z',
  },
  {
    id: 'user-002',
    email: 'lan.tran@fpt.edu.vn',
    fullName: 'Lan Tran',
    avatarUrl: null,
    systemRole: 'user',
    isActive: true,
    lastLoginAt: '2026-05-27T14:30:00Z',
  },
  {
    id: 'user-003',
    email: 'khoa.le@fpt.edu.vn',
    fullName: 'Khoa Le',
    avatarUrl: null,
    systemRole: 'user',
    isActive: true,
    lastLoginAt: '2026-05-26T09:00:00Z',
  },
  {
    id: 'user-004',
    email: 'admin@insightvault.ai',
    fullName: 'System Admin',
    avatarUrl: null,
    systemRole: 'admin',
    isActive: true,
    lastLoginAt: '2026-05-28T10:00:00Z',
  },
  {
    id: 'user-005',
    email: 'huy.do@fpt.edu.vn',
    fullName: 'Huy Do',
    avatarUrl: null,
    systemRole: 'user',
    isActive: false,
    lastLoginAt: '2026-05-10T12:00:00Z',
  },
]

export const mockAdminStats = {
  totalWorkspaces: 8,
  totalDocuments: 42,
  storageUsedGb: '12.4 GB',
  storageQuotaGb: '50.0 GB',
  activeUsers: 5,
}

export const mockAdminMetrics: AdminMetric[] = [
  { label: 'Total Users', value: 5, change: '+2 this week', trend: 'up' },
  { label: 'Workspaces', value: 8, change: '+1 this week', trend: 'up' },
  { label: 'Documents', value: 42, change: '+6 this week', trend: 'up' },
  { label: 'Processing', value: 2, change: 'Active now', trend: 'stable' },
  { label: 'Failed Jobs', value: 3, change: '1 new today', trend: 'down' },
  { label: 'Reports', value: 14, change: '+3 this week', trend: 'up' },
]
