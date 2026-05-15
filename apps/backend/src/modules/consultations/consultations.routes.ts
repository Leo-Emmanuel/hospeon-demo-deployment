import { Router } from 'express';
import { Role } from '@hospeon/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { idParamSchema, validateRequest } from '../../middlewares/validate.middleware';
import { completeConsultation, completeVisitHandler, createConsultation, getConsultation, updateConsultation } from './consultations.controller';
import { completeVisitSchema, createConsultationSchema, updateConsultationSchema } from './consultations.validation';

const router = Router();
router.use(requireAuth, requireRole([Role.ADMIN, Role.DOCTOR]));
router.post('/complete-visit', validateRequest(completeVisitSchema), completeVisitHandler);
router.post('/', validateRequest(createConsultationSchema), createConsultation);
router.get('/:id', validateRequest(idParamSchema, 'params'), getConsultation);
router.put('/:id', validateRequest(idParamSchema, 'params'), validateRequest(updateConsultationSchema), updateConsultation);
router.patch('/:id/complete', validateRequest(idParamSchema, 'params'), completeConsultation);

export default router;
