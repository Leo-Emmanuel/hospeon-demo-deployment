import { Router } from 'express';
import { Role, UserCategory } from '@hospeon/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole, requireUserCategory } from '../../middlewares/rbac.middleware';
import { idParamSchema, validateRequest } from '../../middlewares/validate.middleware';
import {
	appointmentQuerySchema,
	appointmentSlotsQuerySchema,
	createAppointmentSchema,
	createPatientAppointmentSchema,
	createDoctorLeaveSchema,
	createDoctorScheduleSchema,
	doctorScheduleQuerySchema,
	updateAppointmentStatusSchema,
	updateDoctorScheduleSchema,
} from './appointments.validation';
import {
	createAppointment,
	createDoctorLeave,
	createDoctorSchedule,
	createPatientAppointment,
	deleteDoctorLeave,
	getAppointment,
	getAppointmentSlots,
	listAppointments,
	listMyAppointments,
	listDoctorSchedules,
	updateAppointmentStatus,
	updateDoctorSchedule,
} from './appointments.controller';

const router = Router();

router.use(requireAuth);

router.get('/', requireRole([Role.ADMIN, Role.RECEPTIONIST, Role.NURSE, Role.DOCTOR]), validateRequest(appointmentQuerySchema, 'query'), listAppointments);
router.get('/my', requireUserCategory([UserCategory.PATIENT]), validateRequest(appointmentQuerySchema, 'query'), listMyAppointments);
router.get('/slots', validateRequest(appointmentSlotsQuerySchema, 'query'), getAppointmentSlots);
router.post('/', requireRole([Role.ADMIN, Role.RECEPTIONIST]), validateRequest(createAppointmentSchema), createAppointment);
router.post('/patient', requireUserCategory([UserCategory.PATIENT]), validateRequest(createPatientAppointmentSchema), createPatientAppointment);
router.get('/schedules', requireRole([Role.ADMIN]), validateRequest(doctorScheduleQuerySchema, 'query'), listDoctorSchedules);
router.post('/schedules', requireRole([Role.ADMIN]), validateRequest(createDoctorScheduleSchema), createDoctorSchedule);
router.put('/schedules/:id', requireRole([Role.ADMIN]), validateRequest(idParamSchema, 'params'), validateRequest(updateDoctorScheduleSchema), updateDoctorSchedule);

router.post('/leaves', requireRole([Role.ADMIN]), validateRequest(createDoctorLeaveSchema), createDoctorLeave);
router.delete('/leaves/:id', requireRole([Role.ADMIN]), validateRequest(idParamSchema, 'params'), deleteDoctorLeave);

router.get('/:id', validateRequest(idParamSchema, 'params'), getAppointment);
router.patch('/:id/status', requireRole([Role.ADMIN, Role.RECEPTIONIST, Role.DOCTOR]), validateRequest(idParamSchema, 'params'), validateRequest(updateAppointmentStatusSchema), updateAppointmentStatus);

export default router;
