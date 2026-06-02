import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportApi } from '../api/reportApi';
import type { GenerateReportRequest, CompareRequest, ReportType } from '../types/api';

export const reportKeys = {
  all: ['reports'] as const,
  workspace: (workspaceId: string) => [...reportKeys.all, workspaceId] as const,
  lists: (workspaceId: string) => [...reportKeys.workspace(workspaceId), 'list'] as const,
  list: (workspaceId: string, type?: ReportType) => 
    [...reportKeys.lists(workspaceId), { type }] as const,
  details: () => [...reportKeys.all, 'detail'] as const,
  detail: (id: string) => [...reportKeys.details(), id] as const,
};

export const useReports = (workspaceId: string | null, type?: ReportType) => {
  return useQuery({
    queryKey: reportKeys.list(workspaceId!, type),
    queryFn: () => reportApi.getReports(workspaceId!, type),
    enabled: !!workspaceId,
  });
};

export const useReport = (reportId: string | null) => {
  return useQuery({
    queryKey: reportKeys.detail(reportId!),
    queryFn: () => reportApi.getReport(reportId!),
    enabled: !!reportId,
  });
};

export const useGenerateReport = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GenerateReportRequest) => reportApi.generateReport(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists(workspaceId) });
    },
  });
};

export const useDeleteReport = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => reportApi.deleteReport(reportId),
    onSuccess: (_, deletedId) => {
      queryClient.invalidateQueries({ queryKey: reportKeys.lists(workspaceId) });
      queryClient.removeQueries({ queryKey: reportKeys.detail(deletedId) });
    },
  });
};

export const useCompareDocuments = () => {
  return useMutation({
    mutationFn: ({ workspaceId, data }: { workspaceId: string; data: CompareRequest }) => 
      reportApi.compareDocuments(workspaceId, data),
  });
};
