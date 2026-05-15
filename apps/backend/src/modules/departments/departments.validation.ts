import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().min(1),
  headDoctorId: z.string().uuid().optional(),
  description: z.string().optional(),
});
