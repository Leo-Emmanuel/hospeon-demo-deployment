import { Router } from 'express';

import authRoutes from './auth/auth.routes';
import userRoutes from './users/users.routes';
import patientRoutes from './patients/patients.routes';
import visitRoutes from './visits/visits.routes';
import appointmentRoutes from './appointments/appointments.routes';
import consultationRoutes from './consultations/consultations.routes';
import prescriptionRoutes from './prescriptions/prescriptions.routes';
import labOrderRoutes from './lab-orders/lab-orders.routes';
import labResultRoutes from './lab-results/lab-results.routes';
import labTestsCatalogRoutes from './lab-tests-catalog/lab-tests-catalog.routes';
import dashboardRoutes from './dashboard/dashboard.routes';
import departmentRoutes from './departments/departments.routes';
import notificationRoutes from './notifications/notifications.routes';
import auditRoutes from './audit/audit.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/patients', patientRoutes);
router.use('/visits', visitRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/consultations', consultationRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/lab-orders', labOrderRoutes);
router.use('/lab-results', labResultRoutes);
router.use('/lab-tests-catalog', labTestsCatalogRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/departments', departmentRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit', auditRoutes);

export default router;
