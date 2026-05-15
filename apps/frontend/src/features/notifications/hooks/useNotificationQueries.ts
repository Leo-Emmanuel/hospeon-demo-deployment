import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '@/services/notificationService';

export const notificationKeys = {
  all: ['notifications'] as const,
  unread: () => [...notificationKeys.all, 'unread'] as const,
};

export const useUnreadNotifications = () =>
  useQuery({
    queryKey: notificationKeys.unread(),
    queryFn: () => notificationService.getUnread(),
    refetchInterval: 60000,
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => notificationService.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => notificationService.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
};
