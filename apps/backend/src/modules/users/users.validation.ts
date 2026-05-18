import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination';

export const listUsersQuerySchema = paginationQuerySchema.extend({
  role: z.enum(['ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'NURSE', 'PHARMACIST', 'ACCOUNTANT', 'STAFF']).optional(),
  isActive: z.coerce.boolean().optional(),
});

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(8).optional(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'DOCTOR', 'LAB_TECHNICIAN', 'RECEPTIONIST', 'NURSE', 'PHARMACIST', 'ACCOUNTANT', 'STAFF']),
  departmentId: z.string().uuid().optional(),
  staffId: z.string().min(3).optional(),
  userType: z.string().min(2).optional(),
});

export const updateUserSchema = createUserSchema.partial().extend({
  email: z.string().email(),
});
