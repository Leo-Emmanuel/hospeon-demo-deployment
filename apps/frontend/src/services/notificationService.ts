import { apiClient } from '@/lib/axios';
import { ApiResponse } from '@/services/patientService';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  getUnread: async (): Promise<ApiResponse<NotificationItem[]>> => apiClient.get('/notifications'),
  markRead: async (id: string): Promise<ApiResponse<{ updated: boolean; count: number }>> =>
    apiClient.patch(`/notifications/${id}/read`),
  markAllRead: async (): Promise<ApiResponse<{ count: number }>> => apiClient.patch('/notifications/read-all'),
};
