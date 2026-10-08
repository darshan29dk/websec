import client from './client';
import { ApiResponse, PageResponse } from '../../types/common';
import { DetectionMatch, DetectionRule } from '../../types/event';

export const detectionApi = {
  getDetections: async (
    page = 0,
    size = 20,
    targetId?: string,
    status?: string
  ): Promise<PageResponse<DetectionMatch>> => {
    const params: Record<string, any> = { page, size };
    if (targetId) params.targetId = targetId;
    if (status) params.status = status;

    return client.get<PageResponse<DetectionMatch>>('/detections', { params });
  },

  getDetectionById: async (id: string): Promise<DetectionMatch> => {
    return client.get<DetectionMatch>(`/detections/${id}`);
  },

  updateStatus: async (id: string, status: string): Promise<DetectionMatch> => {
    return client.patch<DetectionMatch>(`/detections/${id}/status`, { status });
  },

  getRules: async (): Promise<DetectionRule[]> => {
    return client.get<DetectionRule[]>('/detections/rules');
  }
};
