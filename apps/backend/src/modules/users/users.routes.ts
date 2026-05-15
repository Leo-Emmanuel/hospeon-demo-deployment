import { Router } from 'express';
import { Role } from '@hospeon/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { idParamSchema, validateRequest } from '../../middlewares/validate.middleware';
import { createUserSchema, listUsersQuerySchema, updateUserSchema } from './users.validation';
import {
  createUser,
  deactivateUser,
  getUser,
  listDoctors,
  listUsers,
  updateUser,
} from './users.controller';

const router = Router();

router.use(requireAuth);

router.get('/doctors', requireRole([Role.ADMIN, Role.RECEPTIONIST, Role.NURSE]), listDoctors);

router.get('/', requireRole([Role.ADMIN]), validateRequest(listUsersQuerySchema, 'query'), listUsers);
router.post('/', requireRole([Role.ADMIN]), validateRequest(createUserSchema), createUser);
router.get('/:id', requireRole([Role.ADMIN]), validateRequest(idParamSchema, 'params'), getUser);
router.put('/:id', requireRole([Role.ADMIN]), validateRequest(idParamSchema, 'params'), validateRequest(updateUserSchema), updateUser);
router.patch('/:id/deactivate', requireRole([Role.ADMIN]), validateRequest(idParamSchema, 'params'), deactivateUser);

export default router;
