import { Router } from 'express';
import { Role } from '@hospeon/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { listAuditLogs } from './audit.controller';
import { auditQuerySchema } from './audit.validation';

const router = Router();
router.use(requireAuth, requireRole([Role.ADMIN]));
router.get('/', validateRequest(auditQuerySchema, 'query'), listAuditLogs);

export default router;
