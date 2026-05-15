import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination';

export const visitsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED']).optional(),
  doctorId: z.string().uuid().optional(),
  date: z.string().optional(),
});

export const createVisitSchema = z.object({
  patientId: z.string().uuid(),
  visitType: z.enum(['OPD', 'IPD', 'EMERGENCY']).default('OPD'),
  doctorId: z.string().uuid(),
  departmentId: z.string().uuid(),
  chiefComplaint: z.string().optional(),
  vitals: z.record(z.any()).optional(),
});

export const updateVisitSchema = z.object({
  chiefComplaint: z.string().optional(),
  vitals: z.record(z.any()).optional(),
});

export const updateVisitStatusSchema = z.object({
  status: z.enum(['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED']),
});
