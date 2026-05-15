import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';

export const unreadNotifications = catchAsync(async (req: Request, res: Response) => {
  const notifications = await prisma.notification.findMany({ where: { userId: req.user!.userId, isRead: false }, orderBy: { createdAt: 'desc' } });
  return successResponse(res, notifications, 'Unread notifications fetched');
});

export const markNotificationRead = catchAsync(async (req: Request, res: Response) => {
  const result = await prisma.notification.updateMany({
    where: {
      id: req.params.id,
      userId: req.user!.userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return successResponse(
    res,
    { updated: result.count > 0, count: result.count },
    result.count > 0 ? 'Notification marked as read' : 'Notification was already read or not found'
  );
});

export const markAllNotificationsRead = catchAsync(async (req: Request, res: Response) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId: req.user!.userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return successResponse(res, { count: result.count }, 'Notifications marked as read');
});
