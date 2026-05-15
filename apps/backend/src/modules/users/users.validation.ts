import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination';

export const listUsersQuerySchema = paginationQuerySchema.extend({
  role: z.enum(['ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'NURSE', 'PHARMACIST', 'ACCOUNTANT', 'STAFF']).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'NURSE', 'PHARMACIST', 'ACCOUNTANT', 'STAFF']),
  departmentId: z.string().uuid().optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  email: z.string().email(),
});
