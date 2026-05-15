import { z } from 'zod';

export const createPrescriptionsSchema = z.object({
  consultationId: z.string().uuid(),
  prescriptions: z.array(z.object({
    drugName: z.string().min(1),
    dosage: z.string().min(1),
    frequency: z.string().min(1),
    durationDays: z.coerce.number().int().positive(),
    route: z.string().optional(),
    instructions: z.string().optional(),
  })).min(1),
});
