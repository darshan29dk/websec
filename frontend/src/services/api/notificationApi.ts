import { client } from './client';
import { NotificationDto } from '../../types/notification';
import { PageResponse } from '../../types/common';

export const notificationApi = {
  getNotifications: async (page = 0, size = 20): Promise<PageResponse<NotificationDto>> => {
    return client.get<PageResponse<NotificationDto>>('/notifications', { params: { page, size } });
  },

  getUnreadNotifications: async (): Promise<NotificationDto[]> => {
    return client.get<NotificationDto[]>('/notifications/unread');
  },

  markAsRead: async (id: string): Promise<NotificationDto> => {
    return client.post<NotificationDto>(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    return client.post<void>('/notifications/read-all');
  },
};
