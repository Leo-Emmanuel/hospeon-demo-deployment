import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination';

export const patientQuerySchema = paginationQuerySchema.extend({
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  bloodGroup: z.string().optional(),
  visitFrom: z.string().optional(),
  visitTo: z.string().optional(),
});

export const createPatientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dob: z.coerce.date(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  bloodGroup: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.record(z.any()).optional(),
  emergencyContact: z.record(z.any()).optional(),
  insuranceInfo: z.record(z.any()).optional(),
  departmentId: z.string().uuid().optional(),
});

export const updatePatientSchema = createPatientSchema.partial();
