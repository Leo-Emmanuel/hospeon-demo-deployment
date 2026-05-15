import { Router } from 'express';
import { Role } from '@hospeon/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { orderIdParamSchema, validateRequest } from '../../middlewares/validate.middleware';
import { approveLabResult, enterLabResult, getLabResult, updateLabResult } from './lab-results.controller';
import { upsertLabResultSchema } from './lab-results.validation';

const router = Router();
router.use(requireAuth);
router.post('/:orderId', requireRole([Role.ADMIN, Role.LAB_TECHNICIAN]), validateRequest(orderIdParamSchema, 'params'), validateRequest(upsertLabResultSchema), enterLabResult);
router.get('/:orderId', requireRole([Role.ADMIN, Role.DOCTOR, Role.LAB_TECHNICIAN]), validateRequest(orderIdParamSchema, 'params'), getLabResult);
router.put('/:orderId', requireRole([Role.ADMIN, Role.LAB_TECHNICIAN]), validateRequest(orderIdParamSchema, 'params'), validateRequest(upsertLabResultSchema), updateLabResult);
router.patch('/:orderId/approve', requireRole([Role.ADMIN, Role.DOCTOR]), validateRequest(orderIdParamSchema, 'params'), approveLabResult);

export default router;
