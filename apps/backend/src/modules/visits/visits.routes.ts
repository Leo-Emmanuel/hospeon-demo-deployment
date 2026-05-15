import { Router } from 'express';
import { Role } from '@hospeon/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { idParamSchema, validateRequest } from '../../middlewares/validate.middleware';
import { createVisitSchema, updateVisitSchema, updateVisitStatusSchema, visitsQuerySchema } from './visits.validation';
import { createVisit, getVisit, listVisits, updateVisit, updateVisitStatus } from './visits.controller';

const router = Router();
const visitRoles = [Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.NURSE];

router.use(requireAuth);
router.post('/', requireRole([Role.ADMIN, Role.RECEPTIONIST]), validateRequest(createVisitSchema), createVisit);
router.get('/', requireRole(visitRoles), validateRequest(visitsQuerySchema, 'query'), listVisits);
router.get('/:id', requireRole(visitRoles), validateRequest(idParamSchema, 'params'), getVisit);
router.patch('/:id/status', requireRole(visitRoles), validateRequest(idParamSchema, 'params'), validateRequest(updateVisitStatusSchema), updateVisitStatus);
router.put('/:id', requireRole(visitRoles), validateRequest(idParamSchema, 'params'), validateRequest(updateVisitSchema), updateVisit);

export default router;
