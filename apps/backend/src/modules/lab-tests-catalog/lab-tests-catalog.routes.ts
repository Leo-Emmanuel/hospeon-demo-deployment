import { Router } from 'express';
import { Role } from '@hospeon/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { listLabTestsCatalog } from './lab-tests-catalog.controller';

const router = Router();
router.use(requireAuth, requireRole([Role.ADMIN, Role.DOCTOR, Role.LAB_TECHNICIAN]));
router.get('/', listLabTestsCatalog);

export default router;
