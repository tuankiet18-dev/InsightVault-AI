import { http } from './http';

export interface HealthResponse {
  status: string;
  message: string;
}

export interface MetaResponse {
  name: string;
  description: string;
  mvpCapabilities: string[];
}

export const systemApi = {
  getHealth: () => {
    return http.get<HealthResponse>('/health');
  },

  getDbHealth: () => {
    return http.get<HealthResponse>('/health/db');
  },

  getMeta: () => {
    return http.get<MetaResponse>('/meta');
  },
};
