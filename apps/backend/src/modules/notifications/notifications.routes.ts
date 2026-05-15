import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { markAllNotificationsRead, markNotificationRead, unreadNotifications } from './notifications.controller';

const router = Router();
router.use(requireAuth);
router.get('/', unreadNotifications);
router.patch('/read-all', markAllNotificationsRead);
router.patch('/:id/read', markNotificationRead);

export default router;
