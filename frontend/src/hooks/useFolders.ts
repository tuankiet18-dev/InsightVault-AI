import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { folderApi, type CreateFolderData, type UpdateFolderData } from '../api/folderApi';

export const folderKeys = {
  all: ['folders'] as const,
  workspace: (workspaceId: string) => [...folderKeys.all, workspaceId] as const,
  lists: (workspaceId: string) => [...folderKeys.workspace(workspaceId), 'list'] as const,
  list: (workspaceId: string, parentFolderId?: string) => 
    [...folderKeys.lists(workspaceId), { parentFolderId }] as const,
  details: () => [...folderKeys.all, 'detail'] as const,
  detail: (id: string) => [...folderKeys.details(), id] as const,
};

export const useFolders = (workspaceId: string | null, parentFolderId?: string) => {
  return useQuery({
    queryKey: folderKeys.list(workspaceId!, parentFolderId),
    queryFn: () => folderApi.getFolders(workspaceId!, parentFolderId),
    enabled: !!workspaceId,
  });
};

export const useFolder = (folderId: string | null) => {
  return useQuery({
    queryKey: folderKeys.detail(folderId!),
    queryFn: () => folderApi.getFolder(folderId!),
    enabled: !!folderId,
  });
};

export const useCreateFolder = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFolderData) => folderApi.createFolder(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists(workspaceId) });
      toast.success('Folder created successfully');
    },
    onError: () => {
      toast.error('Failed to create folder');
    }
  });
};

export const useUpdateFolder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ folderId, data }: { folderId: string; data: UpdateFolderData }) => 
      folderApi.updateFolder(folderId, data),
    onSuccess: (updatedFolder) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.detail(updatedFolder.id) });
      queryClient.invalidateQueries({ queryKey: folderKeys.lists(updatedFolder.workspaceId) });
      toast.success('Folder updated successfully');
    },
    onError: () => {
      toast.error('Failed to update folder');
    }
  });
};

export const useDeleteFolder = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (folderId: string) => folderApi.deleteFolder(folderId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: folderKeys.lists(workspaceId) });
      queryClient.removeQueries({ queryKey: folderKeys.detail(deletedId) });
      toast.success('Folder deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete folder');
    }
  });
};
