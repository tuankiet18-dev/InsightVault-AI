import { http } from './http';
import type { 
  ReportDto, 
  GenerateReportRequest, 
  CompareRequest, 
  ReportType,
  AiJobDto
} from '../types/api';

export const reportApi = {
  // Reports
  getReports: (workspaceId: string, type?: ReportType) => {
    return http.get<ReportDto[]>(`/workspaces/${workspaceId}/reports`, { params: { type } });
  },

  getReport: (reportId: string) => {
    return http.get<ReportDto>(`/reports/${reportId}`);
  },

  generateReport: (workspaceId: string, data: GenerateReportRequest) => {
    return http.post<AiJobDto>(`/workspaces/${workspaceId}/reports/generate`, data);
  },

  deleteReport: (reportId: string) => {
    return http.delete<void>(`/reports/${reportId}`);
  },

  // Compare
  compareDocuments: (workspaceId: string, data: CompareRequest) => {
    return http.post<AiJobDto>(`/workspaces/${workspaceId}/compare`, data);
  },
};
