import { Router } from 'express';
import { Role } from '@hospeon/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { validateRequest } from '../../middlewares/validate.middleware';
import { createDepartment, listDepartments, updateDepartment } from './departments.controller';
import { createDepartmentSchema } from './departments.validation';

const router = Router();
router.use(requireAuth);
router.get('/', requireRole([Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST]), listDepartments);
router.post('/', requireRole([Role.ADMIN]), validateRequest(createDepartmentSchema), createDepartment);
router.put('/:id', requireRole([Role.ADMIN]), updateDepartment);

export default router;
