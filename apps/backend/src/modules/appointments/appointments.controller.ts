import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';
import { appointmentsService } from './appointments.service';
import { AppError } from '../../utils/app-error';

export const listAppointments = catchAsync(async (req: Request, res: Response) => {
	const result = await appointmentsService.list(req.query, req.user);
	return successResponse(res, result.items, 'Appointments fetched', 200, result.meta);
});

export const listMyAppointments = catchAsync(async (req: Request, res: Response) => {
	const result = await appointmentsService.list(req.query, req.user);
	return successResponse(res, result.items, 'Appointments fetched', 200, result.meta);
});

export const getAppointment = catchAsync(async (req: Request, res: Response) => {
	const appointment = await appointmentsService.getById(req.params.id, req.user);
	return successResponse(res, appointment, 'Appointment fetched');
});

export const getAppointmentSlots = catchAsync(async (req: Request, res: Response) => {
	const { doctorId, date } = req.query as { doctorId: string; date: string };
	const slots = await appointmentsService.getSlots(doctorId, date);
	return successResponse(res, slots, 'Appointment slots fetched');
});

export const createAppointment = catchAsync(async (req: Request, res: Response) => {
	const appointment = await appointmentsService.create(
		req.body,
		{ userId: req.user?.userId, source: 'STAFF' },
		req.ip
	);
	return successResponse(res, appointment, 'Appointment created', 201);
});

export const createPatientAppointment = catchAsync(async (req: Request, res: Response) => {
	if (!req.user?.userId) throw new AppError(401, 'Not authenticated');
	const patientId = await appointmentsService.getPatientIdForUser(req.user.userId);
	if (!patientId) {
		throw new AppError(403, 'Patient profile not found');
	}
	const appointment = await appointmentsService.create(
		req.body,
		{ userId: req.user.userId, source: 'PATIENT', patientId },
		req.ip
	);
	return successResponse(res, appointment, 'Appointment created', 201);
});

export const updateAppointmentStatus = catchAsync(async (req: Request, res: Response) => {
	const appointment = await appointmentsService.updateStatus(req.params.id, req.body.status, req.user || {}, req.ip);
	return successResponse(res, appointment, 'Appointment status updated');
});

export const listDoctorSchedules = catchAsync(async (req: Request, res: Response) => {
	const { doctorId } = req.query as { doctorId: string };
	const schedules = await appointmentsService.listSchedules(doctorId);
	return successResponse(res, schedules, 'Doctor schedules fetched');
});

export const createDoctorSchedule = catchAsync(async (req: Request, res: Response) => {
	const schedule = await appointmentsService.createSchedule(req.body, req.user?.userId, req.ip);
	return successResponse(res, schedule, 'Doctor schedule created', 201);
});

export const updateDoctorSchedule = catchAsync(async (req: Request, res: Response) => {
	const schedule = await appointmentsService.updateSchedule(req.params.id, req.body, req.user?.userId, req.ip);
	return successResponse(res, schedule, 'Doctor schedule updated');
});

export const createDoctorLeave = catchAsync(async (req: Request, res: Response) => {
	const leave = await appointmentsService.createLeave(req.body, req.user?.userId, req.ip);
	return successResponse(res, leave, 'Doctor leave created', 201);
});

export const deleteDoctorLeave = catchAsync(async (req: Request, res: Response) => {
	const leave = await appointmentsService.deleteLeave(req.params.id, req.user?.userId, req.ip);
	return successResponse(res, leave, 'Doctor leave removed');
});
