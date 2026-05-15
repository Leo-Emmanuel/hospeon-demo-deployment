import { Router } from 'express';
import { Role } from '@hospeon/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { idParamSchema, validateRequest } from '../../middlewares/validate.middleware';
import { cancelLabOrder, createLabOrder, getLabOrder, listLabOrders, updateLabOrderStatus } from './lab-orders.controller';
import { createLabOrderSchema, labOrdersQuerySchema, updateLabOrderStatusSchema } from './lab-orders.validation';

const router = Router();
router.use(requireAuth);
router.get('/', requireRole([Role.ADMIN, Role.DOCTOR, Role.LAB_TECHNICIAN]), validateRequest(labOrdersQuerySchema, 'query'), listLabOrders);
router.post('/', requireRole([Role.ADMIN, Role.DOCTOR]), validateRequest(createLabOrderSchema), createLabOrder);
router.get('/:id', requireRole([Role.ADMIN, Role.DOCTOR, Role.LAB_TECHNICIAN]), validateRequest(idParamSchema, 'params'), getLabOrder);
router.patch('/:id/status', requireRole([Role.ADMIN, Role.DOCTOR, Role.LAB_TECHNICIAN]), validateRequest(idParamSchema, 'params'), validateRequest(updateLabOrderStatusSchema), updateLabOrderStatus);
router.delete('/:id', requireRole([Role.ADMIN, Role.DOCTOR]), validateRequest(idParamSchema, 'params'), cancelLabOrder);

export default router;
