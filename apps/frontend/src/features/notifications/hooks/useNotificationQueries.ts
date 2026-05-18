import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';

import { QK } from '@/lib/queryKeys';

export const useUnreadNotifications = () =>
  useQuery({
    queryKey: QK.notifications.unread(),
    queryFn: () => notificationService.getUnread(),
    refetchInterval: 60000,
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.notifications.all?.() || ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.notifications.all?.() || ['notifications'] });
    },
  });
};
