import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { getPagination, getPaginationMeta } from '../../utils/pagination';
import { writeAuditLog } from '../../utils/auditLog';
import { appointmentStatusTransitions, activeAppointmentStatuses } from './appointments.constants';
import { appointmentsRepository } from './appointments.repository';
import { AppointmentSlot } from './appointments.types';

const parseTime = (value: string) => {
	const [hours, minutes] = value.split(':').map((part) => Number(part));
	return { hours, minutes };
};

const withTime = (date: Date, time: string) => {
	const { hours, minutes } = parseTime(time);
	const next = new Date(date);
	next.setUTCHours(hours, minutes, 0, 0);
	return next;
};

const getDayRange = (date: Date) => {
	const start = new Date(date);
	start.setUTCHours(0, 0, 0, 0);
	const end = new Date(start);
	end.setUTCDate(end.getUTCDate() + 1);
	return { start, end };
};

export class AppointmentsService {
	async getPatientIdForUser(userId: string) {
		const patient = await prisma.patient.findFirst({ where: { userId, deletedAt: null } });
		return patient?.id || null;
	}

	async list(query: any, currentUser?: { userId: string; role?: string; userCategory?: string }) {
		const { page, limit, skip, take } = getPagination(query);
		const where: Prisma.AppointmentWhereInput = {
			...(query.status && { status: query.status }),
			...(query.doctorId && { doctorId: query.doctorId }),
			...(query.patientId && { patientId: query.patientId }),
			...(query.departmentId && { departmentId: query.departmentId }),
		};
		if (query.dateFrom || query.dateTo) {
			where.startAt = {
				...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
				...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
			};
		}
		if (currentUser?.role && String(currentUser.role).toUpperCase() === 'DOCTOR') {
			where.doctorId = currentUser.userId;
		}
		if (currentUser?.userCategory && String(currentUser.userCategory).toUpperCase() === 'PATIENT') {
			const patient = await prisma.patient.findFirst({ where: { userId: currentUser.userId, deletedAt: null } });
			if (!patient) throw new AppError(403, 'Patient profile not found');
			where.patientId = patient.id;
		}
		const [items, total] = await Promise.all([
			appointmentsRepository.findMany(where, skip, take),
			appointmentsRepository.count(where),
		]);
		return { items, meta: getPaginationMeta(page, limit, total) };
	}

	async getById(id: string, currentUser?: { userId: string; role?: string; userCategory?: string }) {
		const appointment = await prisma.appointment.findUnique({
			where: { id },
			include: { patient: true, doctor: { select: { id: true, name: true } }, department: true, visit: true },
		});
		if (!appointment) throw new AppError(404, 'Appointment not found');
		if (currentUser?.role && String(currentUser.role).toUpperCase() === 'DOCTOR' && appointment.doctorId !== currentUser.userId) {
			throw new AppError(403, 'You do not have permission to access this appointment');
		}
		if (currentUser?.userCategory && String(currentUser.userCategory).toUpperCase() === 'PATIENT') {
			const patient = await prisma.patient.findFirst({ where: { userId: currentUser.userId, deletedAt: null } });
			if (!patient || appointment.patientId !== patient.id) {
				throw new AppError(403, 'You do not have permission to access this appointment');
			}
		}
		return appointment;
	}

	async getSlots(doctorId: string, date: string): Promise<AppointmentSlot[]> {
		const doctor = await prisma.user.findFirst({ where: { id: doctorId, deletedAt: null, isActive: true } });
		if (!doctor) throw new AppError(404, 'Doctor not found');

		const day = new Date(date);
		const dayOfWeek = day.getUTCDay();
		const schedule = await prisma.doctorSchedule.findFirst({
			where: { doctorId, dayOfWeek, isActive: true },
			orderBy: { startTime: 'asc' },
		});
		if (!schedule) return [];

		const { start, end } = getDayRange(day);
		const leave = await prisma.doctorLeave.findFirst({ where: { doctorId, date: start } });
		if (leave) return [];

		const scheduleStart = withTime(start, schedule.startTime);
		const scheduleEnd = withTime(start, schedule.endTime);
		const breakStart = schedule.breakStart ? withTime(start, schedule.breakStart) : null;
		const breakEnd = schedule.breakEnd ? withTime(start, schedule.breakEnd) : null;

		const existing = await prisma.appointment.findMany({
			where: {
				doctorId,
				status: { in: activeAppointmentStatuses as any },
				startAt: { gte: scheduleStart, lt: scheduleEnd },
			},
		});

		const slots: AppointmentSlot[] = [];
		const slotMinutes = schedule.slotMinutes;
		for (let cursor = new Date(scheduleStart); cursor < scheduleEnd; ) {
			const slotStart = new Date(cursor);
			const slotEnd = new Date(cursor);
			slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + slotMinutes);

			const inBreak =
				breakStart && breakEnd && slotStart >= breakStart && slotStart < breakEnd;
			if (slotEnd > scheduleEnd) break;

			const bookedCount = existing.filter(
				(appointment) => appointment.startAt < slotEnd && appointment.endAt > slotStart
			).length;

			const status = inBreak
				? 'BLOCKED'
				: bookedCount >= schedule.capacity
					? 'BOOKED'
					: 'AVAILABLE';

			slots.push({
				startAt: slotStart.toISOString(),
				endAt: slotEnd.toISOString(),
				status,
				bookedCount,
				capacity: schedule.capacity,
			});

			cursor.setUTCMinutes(cursor.getUTCMinutes() + slotMinutes);
		}

		return slots;
	}

	async create(
		data: any,
		actor: { userId?: string; source: 'STAFF' | 'PATIENT'; patientId?: string },
		ipAddress?: string
	) {
		return prisma.$transaction(async (tx) => {
			const patientId = actor.patientId || data.patientId;
			const [patient, doctor, department] = await Promise.all([
				tx.patient.findFirst({ where: { id: patientId, deletedAt: null } }),
				tx.user.findFirst({ where: { id: data.doctorId, deletedAt: null, isActive: true } }),
				tx.department.findUnique({ where: { id: data.departmentId } }),
			]);
			if (!patient) throw new AppError(422, 'Appointment requires an active patient');
			if (!doctor) throw new AppError(422, 'Appointment requires an active doctor');
			if (!department) throw new AppError(422, 'Appointment requires a department');

			const startAt = new Date(data.startAt);
			if (Number.isNaN(startAt.getTime())) throw new AppError(422, 'Invalid appointment start time');

			const { start } = getDayRange(startAt);
			const dayOfWeek = start.getUTCDay();
			const schedule = await tx.doctorSchedule.findFirst({ where: { doctorId: data.doctorId, dayOfWeek, isActive: true } });
			if (!schedule) throw new AppError(422, 'Doctor schedule is not available for this date');

			const leave = await tx.doctorLeave.findFirst({ where: { doctorId: data.doctorId, date: start } });
			if (leave) throw new AppError(422, 'Doctor is unavailable on the selected date');

			const durationMinutes = data.durationMinutes || schedule.slotMinutes;
			const endAt = new Date(startAt);
			endAt.setUTCMinutes(endAt.getUTCMinutes() + durationMinutes);

			const scheduleStart = withTime(start, schedule.startTime);
			const scheduleEnd = withTime(start, schedule.endTime);
			if (startAt < scheduleStart || endAt > scheduleEnd) {
				throw new AppError(422, 'Appointment time is outside doctor working hours');
			}
			if (schedule.breakStart && schedule.breakEnd) {
				const breakStart = withTime(start, schedule.breakStart);
				const breakEnd = withTime(start, schedule.breakEnd);
				if (startAt < breakEnd && endAt > breakStart) {
					throw new AppError(422, 'Appointment overlaps doctor break time');
				}
			}

			const overlapCount = await tx.appointment.count({
				where: {
					doctorId: data.doctorId,
					status: { in: activeAppointmentStatuses as any },
					AND: [{ startAt: { lt: endAt } }, { endAt: { gt: startAt } }],
				},
			});
			if (overlapCount >= schedule.capacity) {
				throw new AppError(422, 'Selected slot is no longer available');
			}

			const appointment = await tx.appointment.create({
				data: {
					patientId,
					doctorId: data.doctorId,
					departmentId: data.departmentId,
					appointmentType: data.appointmentType,
					consultationMode: data.consultationMode,
					reason: data.reason,
					symptoms: data.symptoms,
					notes: data.notes,
					isEmergency: data.isEmergency || false,
					contactPhone: data.contactPhone,
					contactEmail: data.contactEmail,
					startAt,
					endAt,
					source: actor.source,
					createdBy: actor.userId,
				},
			});

			await writeAuditLog(tx, {
				actorId: actor.userId,
				action: 'CREATE',
				entityType: 'appointments',
				entityId: appointment.id,
				newValues: appointment,
				ipAddress,
			});

			return appointment;
		});
	}

	async updateStatus(id: string, status: string, actor: { userId?: string; role?: string }, ipAddress?: string) {
		return prisma.$transaction(async (tx) => {
			const existing = await tx.appointment.findUnique({ where: { id } });
			if (!existing) throw new AppError(404, 'Appointment not found');
			if (!appointmentStatusTransitions[existing.status].includes(status)) {
				throw new AppError(422, `Invalid appointment status transition from ${existing.status} to ${status}`);
			}

			const appointment = await tx.appointment.update({
				where: { id },
				data: {
					status: status as any,
					...(status === 'CANCELLED' ? { cancelledAt: new Date() } : {}),
				},
			});

			if (status === 'CHECKED_IN' && !appointment.visitId) {
				const dayStart = new Date(appointment.startAt);
				dayStart.setUTCHours(0, 0, 0, 0);
				const tokenNumber =
					(await tx.visit.count({ where: { createdAt: { gte: dayStart }, departmentId: appointment.departmentId } })) + 1;
				const visit = await tx.visit.create({
					data: {
						patientId: appointment.patientId,
						doctorId: appointment.doctorId,
						departmentId: appointment.departmentId,
						visitType: 'OPD',
						tokenNumber,
						status: 'WAITING',
						chiefComplaint: appointment.reason || appointment.symptoms || undefined,
						createdBy: actor.userId,
					},
				});
				await tx.appointment.update({ where: { id }, data: { visitId: visit.id } });
			}

			if (status === 'IN_CONSULTATION' && appointment.visitId) {
				await tx.visit.update({ where: { id: appointment.visitId }, data: { status: 'IN_CONSULTATION' } });
			}

			if (status === 'COMPLETED' && appointment.visitId) {
				await tx.visit.update({
					where: { id: appointment.visitId },
					data: { status: 'COMPLETED', checkedOutAt: new Date() },
				});
			}

			await writeAuditLog(tx, {
				actorId: actor.userId,
				action: 'STATUS_CHANGE',
				entityType: 'appointments',
				entityId: id,
				oldValues: existing,
				newValues: appointment,
				ipAddress,
			});

			return appointment;
		});
	}

	async listSchedules(doctorId: string) {
		return prisma.doctorSchedule.findMany({ where: { doctorId }, orderBy: { dayOfWeek: 'asc' } });
	}

	async createSchedule(data: any, actorId?: string, ipAddress?: string) {
		const schedule = await prisma.doctorSchedule.create({ data });
		await writeAuditLog(prisma, {
			actorId,
			action: 'CREATE',
			entityType: 'doctor_schedules',
			entityId: schedule.id,
			newValues: schedule,
			ipAddress,
		});
		return schedule;
	}

	async updateSchedule(id: string, data: any, actorId?: string, ipAddress?: string) {
		const existing = await prisma.doctorSchedule.findUnique({ where: { id } });
		if (!existing) throw new AppError(404, 'Schedule not found');
		const schedule = await prisma.doctorSchedule.update({ where: { id }, data });
		await writeAuditLog(prisma, {
			actorId,
			action: 'UPDATE',
			entityType: 'doctor_schedules',
			entityId: schedule.id,
			oldValues: existing,
			newValues: schedule,
			ipAddress,
		});
		return schedule;
	}

	async createLeave(data: any, actorId?: string, ipAddress?: string) {
		const leaveDate = new Date(data.date);
		leaveDate.setUTCHours(0, 0, 0, 0);
		const leave = await prisma.doctorLeave.create({
			data: {
				doctorId: data.doctorId,
				date: leaveDate,
				reason: data.reason,
			},
		});
		await writeAuditLog(prisma, {
			actorId,
			action: 'CREATE',
			entityType: 'doctor_leaves',
			entityId: leave.id,
			newValues: leave,
			ipAddress,
		});
		return leave;
	}

	async deleteLeave(id: string, actorId?: string, ipAddress?: string) {
		const existing = await prisma.doctorLeave.findUnique({ where: { id } });
		if (!existing) throw new AppError(404, 'Leave not found');
		await prisma.doctorLeave.delete({ where: { id } });
		await writeAuditLog(prisma, {
			actorId,
			action: 'DELETE',
			entityType: 'doctor_leaves',
			entityId: id,
			oldValues: existing,
			ipAddress,
		});
		return existing;
	}
}

export const appointmentsService = new AppointmentsService();
