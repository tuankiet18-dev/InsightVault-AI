import { http } from './http';
import type { ReportDto } from '../types/api';

export const publicApi = {
  getPublicReport: (token: string) => {
    return http.get<ReportDto>(`/public/reports/${token}`);
  },
};
