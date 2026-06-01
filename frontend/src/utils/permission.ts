import type { WorkspaceRole } from '@/types/api'

export type PermissionAction = 
  | 'upload_document'
  | 'delete_document'
  | 'delete_folder'
  | 'invite_member'
  | 'manage_settings'

const rolePermissions: Record<WorkspaceRole, PermissionAction[]> = {
  owner: ['upload_document', 'delete_document', 'delete_folder', 'invite_member', 'manage_settings'],
  editor: ['upload_document', 'delete_document', 'delete_folder'],
  viewer: [],
}

export function hasPermission(role: WorkspaceRole | undefined | null, action: PermissionAction): boolean {
  if (!role) return false;
  return rolePermissions[role]?.includes(action) ?? false;
}
