import client from './client';
import { ApiResponse, PageResponse } from '../../types/common';
import { SecurityEvent, DetectionMatch, SecurityEventType, EventSource } from '../../types/event';

export const eventApi = {
  getEvents: async (
    page = 0,
    size = 20,
    targetId?: string,
    eventType?: SecurityEventType,
    source?: EventSource,
    sourceIp?: string,
    startTime?: string,
    endTime?: string
  ): Promise<ApiResponse<PageResponse<SecurityEvent>>> => {
    const params: Record<string, any> = { page, size };
    if (targetId) params.targetId = targetId;
    if (eventType) params.eventType = eventType;
    if (source) params.source = source;
    if (sourceIp) params.sourceIp = sourceIp;
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    const response = await client.get<ApiResponse<PageResponse<SecurityEvent>>>('/api/v1/events', { params });
    return response.data;
  },

  getEventById: async (id: string): Promise<ApiResponse<SecurityEvent>> => {
    const response = await client.get<ApiResponse<SecurityEvent>>(`/api/v1/events/${id}`);
    return response.data;
  },

  getDetectionsForEvent: async (id: string): Promise<ApiResponse<DetectionMatch[]>> => {
    const response = await client.get<ApiResponse<DetectionMatch[]>>(`/api/v1/events/${id}/detections`);
    return response.data;
  },

  ingestHttpEvent: async (payload: any): Promise<ApiResponse<SecurityEvent>> => {
    const response = await client.post<ApiResponse<SecurityEvent>>('/api/v1/events/http', payload);
    return response.data;
  }
};
