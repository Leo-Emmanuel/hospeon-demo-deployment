import { z } from 'zod';

export const createConsultationSchema = z.object({
  visitId: z.string().uuid(),
  diagnosis: z.string().optional(),
  diagnosisCode: z.string().optional(),
  clinicalNotes: z.string().optional(),
  followUpDate: z.coerce.date().optional(),
});

export const updateConsultationSchema = createConsultationSchema.omit({ visitId: true }).partial();
