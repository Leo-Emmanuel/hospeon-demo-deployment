import { z } from 'zod';
import { paginationQuerySchema } from '../../utils/pagination';

export const appointmentQuerySchema = paginationQuerySchema.extend({
	status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW']).optional(),
	doctorId: z.string().uuid().optional(),
	patientId: z.string().uuid().optional(),
	departmentId: z.string().uuid().optional(),
	dateFrom: z.string().optional(),
	dateTo: z.string().optional(),
});

export const appointmentSlotsQuerySchema = z.object({
	doctorId: z.string().uuid(),
	date: z.string().min(8),
});

export const createAppointmentSchema = z.object({
	patientId: z.string().uuid(),
	doctorId: z.string().uuid(),
	departmentId: z.string().uuid(),
	appointmentType: z.enum(['NEW_CONSULTATION', 'FOLLOW_UP', 'PROCEDURE', 'VACCINATION']).optional(),
	consultationMode: z.enum(['IN_PERSON', 'TELEMED']).optional(),
	reason: z.string().optional(),
	symptoms: z.string().optional(),
	notes: z.string().optional(),
	isEmergency: z.boolean().optional(),
	contactPhone: z.string().min(8).optional(),
	contactEmail: z.string().email().optional(),
	startAt: z.string().datetime(),
	durationMinutes: z.coerce.number().int().positive().optional(),
});

export const createPatientAppointmentSchema = createAppointmentSchema.omit({ patientId: true });

export const updateAppointmentStatusSchema = z.object({
	status: z.enum(['PENDING', 'CONFIRMED', 'CHECKED_IN', 'IN_CONSULTATION', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
	notes: z.string().optional(),
});

export const createDoctorScheduleSchema = z.object({
	doctorId: z.string().uuid(),
	dayOfWeek: z.coerce.number().int().min(0).max(6),
	startTime: z.string().regex(/^\d{2}:\d{2}$/),
	endTime: z.string().regex(/^\d{2}:\d{2}$/),
	breakStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
	breakEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
	slotMinutes: z.coerce.number().int().positive().optional(),
	capacity: z.coerce.number().int().positive().optional(),
	isActive: z.boolean().optional(),
});

export const updateDoctorScheduleSchema = createDoctorScheduleSchema.partial().extend({
	doctorId: z.string().uuid().optional(),
	dayOfWeek: z.coerce.number().int().min(0).max(6).optional(),
});

export const doctorScheduleQuerySchema = z.object({
	doctorId: z.string().uuid(),
});

export const createDoctorLeaveSchema = z.object({
	doctorId: z.string().uuid(),
	date: z.string().min(8),
	reason: z.string().optional(),
});
