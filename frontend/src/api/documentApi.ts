import { http } from './http';
import type { 
  DocumentDto, 
 
  PresignUploadResponse, 
  ConfirmUploadRequest, 
  ConfirmUploadResponse,
  AiJobDto,
  PresignUploadRequest,
  DocumentOriginalAccessResponse,
  DocumentOriginalTextResponse,
  DocumentChunkDto,
  DocumentExtractedTextResponse
} from '../types/api';

export interface GetDocumentsParams {
  folderId?: string;
  status?: string;
  q?: string;
}

export interface UpdateDocumentData {
  folderId?: string | null;
  hasFolderId?: boolean;
}

export const documentApi = {
  // Standard Document CRUD
  getDocuments: (workspaceId: string, params?: GetDocumentsParams) => {
    return http.get<DocumentDto[]>(`/workspaces/${workspaceId}/documents`, { params: params as Record<string, string | number | boolean> });
  },

  getDocument: (documentId: string) => {
    return http.get<DocumentDto>(`/documents/${documentId}`);
  },

  getOriginalAccess: (documentId: string) => {
    return http.get<DocumentOriginalAccessResponse>(`/documents/${documentId}/original/access`);
  },

  getOriginalText: (documentId: string) => {
    return http.get<DocumentOriginalTextResponse>(`/documents/${documentId}/original/text`);
  },

  getChunks: (documentId: string) => {
    return http.get<DocumentChunkDto[]>(`/documents/${documentId}/chunks`);
  },

  getExtractedText: (documentId: string) => {
    return http.get<DocumentExtractedTextResponse>(`/documents/${documentId}/extracted-text`);
  },

  updateDocument: (documentId: string, data: UpdateDocumentData) => {
    return http.patch<DocumentDto>(`/documents/${documentId}`, data);
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
