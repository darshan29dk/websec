import client from './client';
import { ApiResponse } from '../../types/common';
import { SecurityToolStatus } from '../../types/assessment';

export const systemApi = {
  getSecurityTools: async (): Promise<SecurityToolStatus[]> => {
    return client.get<SecurityToolStatus[]>('/system/security-tools');
  }
};
