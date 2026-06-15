import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aiJobApi } from '../api/aiJobApi';
import type { AiJobStatus, AiJobType } from '../types/api';

export const aiJobKeys = {
  all: ['ai-jobs'] as const,
  workspace: (workspaceId: string) => [...aiJobKeys.all, workspaceId] as const,
  lists: (workspaceId: string) => [...aiJobKeys.workspace(workspaceId), 'list'] as const,
  list: (workspaceId: string, status?: AiJobStatus, type?: AiJobType) => 
    [...aiJobKeys.lists(workspaceId), { status, type }] as const,
  details: () => [...aiJobKeys.all, 'detail'] as const,
  detail: (id: string) => [...aiJobKeys.details(), id] as const,
};

export const useAiJobs = (workspaceId: string | null, status?: AiJobStatus, type?: AiJobType) => {
  return useQuery({
    queryKey: aiJobKeys.list(workspaceId!, status, type),
    queryFn: () => aiJobApi.getJobs(workspaceId!, status, type),
    enabled: !!workspaceId,
  });
};

export const useAiJob = (jobId: string | null) => {
  return useQuery({
    queryKey: aiJobKeys.detail(jobId!),
    queryFn: () => aiJobApi.getJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'queued' || status === 'processing' ? 3000 : false;
    },
  });
};

export const useRetryJob = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => aiJobApi.retryJob(jobId),
    onSuccess: (updatedJob) => {
      queryClient.invalidateQueries({ queryKey: aiJobKeys.detail(updatedJob.id) });
      queryClient.invalidateQueries({ queryKey: aiJobKeys.lists(workspaceId) });
    },
  });
};
