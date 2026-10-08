import { ApiClient } from './client';

export interface SecurityToolStatus {
  id?: string;
  toolName: string;
  version?: string;
  executablePath?: string;
  status: 'AVAILABLE' | 'NOT_AVAILABLE' | 'NOT_CONFIGURED' | 'FAILED';
  supportedOperations?: string;
  configurationStatus?: string;
  lastCheckedAt?: string;
}

export const toolsApi = {
  getAllTools: (): Promise<SecurityToolStatus[]> => {
    return ApiClient.get<SecurityToolStatus[]>('/security-tools');
  },

  checkToolHealth: (toolName: string): Promise<SecurityToolStatus> => {
    return ApiClient.get<SecurityToolStatus>(`/security-tools/${toolName}/health`);
  },

  recheckAllTools: (): Promise<SecurityToolStatus[]> => {
    return ApiClient.post<SecurityToolStatus[]>('/security-tools/check-all');
  },
};
