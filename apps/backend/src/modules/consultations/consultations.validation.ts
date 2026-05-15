import { z } from 'zod';

export const createConsultationSchema = z.object({
  visitId: z.string().uuid(),
  diagnosis: z.string().optional(),
  diagnosisCode: z.string().optional(),
  clinicalNotes: z.string().optional(),
  followUpDate: z.coerce.date().optional(),
});

export const updateConsultationSchema = createConsultationSchema.omit({ visitId: true }).partial();

export const completeVisitSchema = z.object({
  visitId: z.string().uuid(),
  diagnosis: z.string().optional(),
  diagnosisCode: z.string().optional(),
  clinicalNotes: z.string().optional(),
  followUpDate: z.coerce.date().optional(),
  prescriptions: z
    .array(
      z.object({
        drugName: z.string().min(1),
        dosage: z.string().min(1),
        frequency: z.string().min(1),
        durationDays: z.coerce.number().int().positive(),
        route: z.string().optional(),
        instructions: z.string().optional(),
      })
    )
    .default([]),
  labOrders: z
    .array(
      z.object({
        testCatalogId: z.string().uuid(),
        priority: z.enum(['ROUTINE', 'URGENT', 'STAT']).default('ROUTINE'),
        notes: z.string().optional(),
      })
    )
    .default([]),
});
