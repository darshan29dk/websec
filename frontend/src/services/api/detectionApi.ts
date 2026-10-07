import client from './client';
import { ApiResponse, PageResponse } from '../../types/common';
import { DetectionMatch, DetectionRule } from '../../types/event';

export const detectionApi = {
  getDetections: async (
    page = 0,
    size = 20,
    targetId?: string,
    status?: string
  ): Promise<ApiResponse<PageResponse<DetectionMatch>>> => {
    const params: Record<string, any> = { page, size };
    if (targetId) params.targetId = targetId;
    if (status) params.status = status;

    const response = await client.get<ApiResponse<PageResponse<DetectionMatch>>>('/api/v1/detections', { params });
    return response.data;
  },

  getDetectionById: async (id: string): Promise<ApiResponse<DetectionMatch>> => {
    const response = await client.get<ApiResponse<DetectionMatch>>(`/api/v1/detections/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<ApiResponse<DetectionMatch>> => {
    const response = await client.patch<ApiResponse<DetectionMatch>>(`/api/v1/detections/${id}/status`, { status });
    return response.data;
  },

  getRules: async (): Promise<ApiResponse<DetectionRule[]>> => {
    const response = await client.get<ApiResponse<DetectionRule[]>>('/api/v1/detections/rules');
    return response.data;
  }
};
