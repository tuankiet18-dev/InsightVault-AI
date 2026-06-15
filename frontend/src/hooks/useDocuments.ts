import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { documentApi, type GetDocumentsParams } from '../api/documentApi';
import type { PresignUploadRequest, ConfirmUploadRequest } from '../types/api';

export const documentKeys = {
  all: ['documents'] as const,
  workspace: (workspaceId: string) => [...documentKeys.all, workspaceId] as const,
  lists: (workspaceId: string) => [...documentKeys.workspace(workspaceId), 'list'] as const,
  list: (workspaceId: string, params?: GetDocumentsParams) => 
    [...documentKeys.lists(workspaceId), { ...params }] as const,
  details: () => [...documentKeys.all, 'detail'] as const,
  detail: (id: string) => [...documentKeys.details(), id] as const,
  originalAccess: (id: string) => [...documentKeys.detail(id), 'original-access'] as const,
  originalText: (id: string) => [...documentKeys.detail(id), 'original-text'] as const,
  trashLists: (workspaceId: string) => [...documentKeys.workspace(workspaceId), 'trash'] as const,
};

export const useDocuments = (workspaceId: string | null, params?: GetDocumentsParams) => {
  return useQuery({
    queryKey: documentKeys.list(workspaceId!, params),
    queryFn: () => documentApi.getDocuments(workspaceId!, params),
    enabled: !!workspaceId,
    refetchInterval: (query) => {
      const docs = query.state.data;
      if (docs && docs.some(d => d.status === 'processing' || d.status === 'uploaded' || d.status === 'pending_upload')) {
        return 5000;
      }
      return false;
    },
  });
};

export const useDocument = (documentId: string | null) => {
  return useQuery({
    queryKey: documentKeys.detail(documentId!),
    queryFn: () => documentApi.getDocument(documentId!),
    enabled: !!documentId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === 'processing' || status === 'uploaded' || status === 'pending_upload') {
        return 5000;
      }
      return false;
    },
  });
};

export const useDocumentOriginalAccess = (documentId: string | null) => {
  return useQuery({
    queryKey: documentKeys.originalAccess(documentId!),
    queryFn: () => documentApi.getOriginalAccess(documentId!),
    enabled: !!documentId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useDocumentOriginalText = (documentId: string | null, enabled: boolean) => {
  return useQuery({
    queryKey: documentKeys.originalText(documentId!),
    queryFn: () => documentApi.getOriginalText(documentId!),
    enabled: !!documentId && enabled,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateDocument = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: import('../api/documentApi').UpdateDocumentData }) => 
      documentApi.updateDocument(documentId, data),
    onSuccess: (updatedDocument) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(updatedDocument.id) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Document updated successfully');
    },
    onError: () => {
      toast.error('Failed to update document');
    }
  });
};

export const useDeleteDocument = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documentApi.deleteDocument(documentId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists(workspaceId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.trashLists(workspaceId) });
      queryClient.removeQueries({ queryKey: documentKeys.detail(deletedId) });
      toast.success('Document deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete document');
    }
  });
};

export const useRequestPresignedUploadUrl = (workspaceId: string) => {
  return useMutation({
    mutationFn: (data: PresignUploadRequest) => documentApi.requestPresignedUploadUrl(workspaceId, data),
    onError: () => {
      toast.error('Failed to initiate upload');
    }
  });
};

export const useConfirmUpload = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: ConfirmUploadRequest }) => 
      documentApi.confirmUpload(documentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.lists(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
    },
    onError: () => {
      toast.error('Failed to confirm upload');
    }
  });
};

export const useRetryProcessing = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documentApi.retryProcessing(documentId),
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: documentKeys.detail(documentId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['ai-jobs'] });
      toast.success('Document processing retried');
    },
    onError: () => {
      toast.error('Failed to retry processing');
    }
  });
};

export const useTrashDocuments = (workspaceId: string | null) => {
  return useQuery({
    queryKey: documentKeys.trashLists(workspaceId!),
    queryFn: () => documentApi.getTrashDocuments(workspaceId!),
    enabled: !!workspaceId,
  });
};

export const useRestoreDocument = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documentApi.restoreDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.trashLists(workspaceId) });
      queryClient.invalidateQueries({ queryKey: documentKeys.lists(workspaceId) });
      queryClient.invalidateQueries({ queryKey: ['folders'] });
      toast.success('Document restored successfully');
    },
    onError: () => {
      toast.error('Failed to restore document');
    }
  });
};

export const useHardDeleteDocument = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => documentApi.hardDeleteDocument(documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: documentKeys.trashLists(workspaceId) });
      toast.success('Document permanently deleted');
    },
    onError: () => {
      toast.error('Failed to permanently delete document');
    }
  });
};
