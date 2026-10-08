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
  ): Promise<PageResponse<SecurityEvent>> => {
    const params: Record<string, any> = { page, size };
    if (targetId) params.targetId = targetId;
    if (eventType) params.eventType = eventType;
    if (source) params.source = source;
    if (sourceIp) params.sourceIp = sourceIp;
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    return client.get<PageResponse<SecurityEvent>>('/events', { params });
  },

  getEventById: async (id: string): Promise<SecurityEvent> => {
    return client.get<SecurityEvent>(`/events/${id}`);
  },

  getDetectionsForEvent: async (id: string): Promise<DetectionMatch[]> => {
    return client.get<DetectionMatch[]>(`/events/${id}/detections`);
  },

  ingestHttpEvent: async (payload: any): Promise<SecurityEvent> => {
    return client.post<SecurityEvent>('/events/http', payload);
  }
};
