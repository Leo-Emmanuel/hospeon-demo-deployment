import { Router } from 'express';
import { Role } from '@hospeon/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { consultationIdParamSchema, idParamSchema, validateRequest } from '../../middlewares/validate.middleware';
import { createPrescriptions, deactivatePrescription, getPrescriptions } from './prescriptions.controller';
import { createPrescriptionsSchema } from './prescriptions.validation';

const router = Router();
router.use(requireAuth, requireRole([Role.ADMIN, Role.DOCTOR]));
router.post('/', validateRequest(createPrescriptionsSchema), createPrescriptions);
router.get('/:consultationId', validateRequest(consultationIdParamSchema, 'params'), getPrescriptions);
router.patch('/:id/deactivate', validateRequest(idParamSchema, 'params'), deactivatePrescription);

export default router;
