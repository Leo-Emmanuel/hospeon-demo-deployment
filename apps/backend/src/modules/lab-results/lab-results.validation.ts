import { z } from 'zod';

export const upsertLabResultSchema = z.object({
  resultValue: z.string().min(1),
  resultUnit: z.string().optional(),
  referenceRange: z.string().optional(),
  isAbnormal: z.boolean().optional(),
  reportFileUrl: z.string().url().optional(),
  notes: z.string().optional(),
});
