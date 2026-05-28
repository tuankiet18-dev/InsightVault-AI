import { http } from './http';
import type { AiJobDto, AiJobStatus, AiJobType } from '../types/api';

export const aiJobApi = {
  getJobs: (workspaceId: string, status?: AiJobStatus, type?: AiJobType) => {
    return http.get<AiJobDto[]>(`/workspaces/${workspaceId}/ai-jobs`, {
      params: { status, type },
    });
  },

  getJob: (jobId: string) => {
    return http.get<AiJobDto>(`/ai-jobs/${jobId}`);
  },

  retryJob: (jobId: string) => {
    return http.post<AiJobDto>(`/ai-jobs/${jobId}/retry`);
  },
};
