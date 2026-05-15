import { z } from 'zod';

export const createLabTestSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(64),
  category: z.string().optional(),
  specimenType: z.string().optional(),
  referenceRangeLow: z.coerce.number().optional(),
  referenceRangeHigh: z.coerce.number().optional(),
  unit: z.string().optional(),
  turnaroundHours: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

export const updateLabTestSchema = createLabTestSchema.partial();
