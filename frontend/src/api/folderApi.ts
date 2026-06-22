import { http } from './http';
import type { FolderDto } from '../types/api';

export interface CreateFolderData {
  name: string;
  description?: string;
  parentFolderId?: string | null;
}

export interface UpdateFolderData {
  name?: string;
  description?: string;
  parentFolderId?: string | null;
  hasParentFolderId?: boolean;
}

export const folderApi = {
  getFolders: (workspaceId: string, parentFolderId?: string, includeAll?: boolean) => {
    return http.get<FolderDto[]>(`/workspaces/${workspaceId}/folders`, {
      params: { parentFolderId, includeAll },
    });
  },

  createFolder: (workspaceId: string, data: CreateFolderData) => {
    return http.post<FolderDto>(`/workspaces/${workspaceId}/folders`, data);
  },

  getFolder: (folderId: string) => {
    return http.get<FolderDto>(`/folders/${folderId}`);
  },

  updateFolder: (folderId: string, data: UpdateFolderData) => {
    return http.patch<FolderDto>(`/folders/${folderId}`, data);
  },

  deleteFolder: (folderId: string) => {
    return http.delete<void>(`/folders/${folderId}`);
  },
};
