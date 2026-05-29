import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { workspaceApi, type CreateWorkspaceData, type UpdateWorkspaceData } from '../api/workspaceApi';

export const workspaceKeys = {
  all: ['workspaces'] as const,
  lists: () => [...workspaceKeys.all, 'list'] as const,
  list: (query?: string) => [...workspaceKeys.lists(), { query }] as const,
  details: () => [...workspaceKeys.all, 'detail'] as const,
  detail: (id: string) => [...workspaceKeys.details(), id] as const,
  members: (id: string) => [...workspaceKeys.detail(id), 'members'] as const,
};

export const useWorkspaces = (query?: string) => {
  return useQuery({
    queryKey: workspaceKeys.list(query),
    queryFn: () => workspaceApi.getWorkspaces(query),
  });
};

export const useWorkspace = (id: string | null) => {
  return useQuery({
    queryKey: workspaceKeys.detail(id!),
    queryFn: () => workspaceApi.getWorkspace(id!),
    enabled: !!id,
  });
};

export const useWorkspaceMembers = (id: string | null) => {
  return useQuery({
    queryKey: workspaceKeys.members(id!),
    queryFn: () => workspaceApi.getMembers(id!),
    enabled: !!id,
  });
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateWorkspaceData) => workspaceApi.createWorkspace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      toast.success('Workspace created successfully');
    },
    onError: () => {
      toast.error('Failed to create workspace');
    }
  });
};

export const useUpdateWorkspace = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateWorkspaceData) => workspaceApi.updateWorkspace(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.detail(workspaceId) });
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      toast.success('Workspace updated successfully');
    },
    onError: () => {
      toast.error('Failed to update workspace');
    }
  });
};

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) => workspaceApi.deleteWorkspace(workspaceId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: workspaceKeys.lists() });
      queryClient.removeQueries({ queryKey: workspaceKeys.detail(deletedId) });
      toast.success('Workspace deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete workspace');
    }
  });
};
