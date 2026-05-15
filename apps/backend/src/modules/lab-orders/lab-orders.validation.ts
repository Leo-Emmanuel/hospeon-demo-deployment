import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination';

export const labOrdersQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['PENDING', 'SAMPLE_COLLECTED', 'PROCESSING', 'RESULTED', 'APPROVED', 'CANCELLED']).optional(),
  patientId: z.string().uuid().optional(),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT']).optional(),
  date: z.string().optional(),
});

export const createLabOrderSchema = z.object({
  visitId: z.string().uuid().optional(),
  consultationId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  testCatalogId: z.string().uuid(),
  priority: z.enum(['ROUTINE', 'URGENT', 'STAT']).default('ROUTINE'),
  notes: z.string().optional(),
}).refine((value) => value.visitId || value.consultationId, 'Lab order requires a visitId or consultationId');

export const updateLabOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'SAMPLE_COLLECTED', 'PROCESSING', 'RESULTED', 'APPROVED', 'CANCELLED']),
});
