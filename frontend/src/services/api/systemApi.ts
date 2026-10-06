import client from './client';
import { ApiResponse } from '../../types/common';
import { SecurityToolStatus } from '../../types/assessment';

export const systemApi = {
  getSecurityTools: async (): Promise<ApiResponse<SecurityToolStatus[]>> => {
    const response = await client.get<ApiResponse<SecurityToolStatus[]>>('/api/v1/system/security-tools');
    return response.data;
  }
};
