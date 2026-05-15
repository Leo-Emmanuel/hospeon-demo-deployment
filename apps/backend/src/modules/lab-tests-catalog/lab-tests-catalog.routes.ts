import { Router } from 'express';
import { Role } from '@hospeon/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createLabTestSchema, updateLabTestSchema } from './lab-tests-catalog.validation';
import { createLabTest, listLabTestsCatalog, toggleLabTest, updateLabTest } from './lab-tests-catalog.controller';

const router = Router();
router.use(requireAuth, requireRole([Role.ADMIN, Role.DOCTOR, Role.LAB_TECHNICIAN]));

router.get('/', listLabTestsCatalog);
router.post('/', requireRole([Role.ADMIN]), validateRequest(createLabTestSchema), createLabTest);
router.put('/:id', requireRole([Role.ADMIN]), validateRequest(updateLabTestSchema), updateLabTest);
router.patch('/:id/toggle', requireRole([Role.ADMIN]), toggleLabTest);

export default router;
