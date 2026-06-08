import { http } from './http';
import type { 
  DocumentDto, 
 
  PresignUploadResponse, 
  ConfirmUploadRequest, 
  ConfirmUploadResponse,
  AiJobDto,
  PresignUploadRequest
} from '../types/api';

export interface GetDocumentsParams {
  folderId?: string;
  status?: string;
  q?: string;
}

export const documentApi = {
  // Standard Document CRUD
  getDocuments: (workspaceId: string, params?: GetDocumentsParams) => {
    return http.get<DocumentDto[]>(`/workspaces/${workspaceId}/documents`, { params: params as Record<string, string | number | boolean> });
  },

  getDocument: (documentId: string) => {
    return http.get<DocumentDto>(`/documents/${documentId}`);
  },

  deleteDocument: (documentId: string) => {
    return http.delete<void>(`/documents/${documentId}`);
  },

  retryProcessing: (documentId: string) => {
    return http.post<AiJobDto>(`/documents/${documentId}/retry-processing`);
  },

  // Upload Flow
  requestPresignedUploadUrl: (workspaceId: string, data: PresignUploadRequest) => {
    return http.post<PresignUploadResponse>(`/workspaces/${workspaceId}/documents/presign-upload`, data);
  },

  confirmUpload: (documentId: string, data: ConfirmUploadRequest) => {
    return http.post<ConfirmUploadResponse>(`/documents/${documentId}/confirm-upload`, data);
  },

  // Trash Flow
  getTrashDocuments: (workspaceId: string) => {
    return http.get<DocumentDto[]>(`/workspaces/${workspaceId}/trash/documents`);
  },

  restoreDocument: (documentId: string) => {
    return http.post<DocumentDto>(`/documents/${documentId}/restore`);
  },

  hardDeleteDocument: (documentId: string) => {
    return http.delete<void>(`/documents/${documentId}/hard-delete`);
  },
};
