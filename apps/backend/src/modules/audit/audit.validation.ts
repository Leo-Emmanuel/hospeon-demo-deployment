import { z } from 'zod';

export const auditQuerySchema = z.object({
  entityType: z.string().trim().optional(),
  dateFrom: z.string().date().optional(),
  dateTo: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
