import { Router } from 'express';
import { Role } from '@hospeon/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { dashboardSummary, doctorWorkload, labQueue, opdQueue, pharmacyWorklist, recentActivity } from './dashboard.controller';

const router = Router();
router.use(requireAuth);
router.get('/summary', dashboardSummary);
router.get('/opd-queue', requireRole([Role.ADMIN, Role.DOCTOR, Role.RECEPTIONIST, Role.NURSE]), opdQueue);
router.get('/lab-queue', requireRole([Role.ADMIN, Role.DOCTOR, Role.LAB_TECHNICIAN]), labQueue);
router.get('/pharmacy-worklist', requireRole([Role.ADMIN, Role.PHARMACIST]), pharmacyWorklist);
router.get('/doctor-workload', requireRole([Role.ADMIN]), doctorWorkload);
router.get('/recent-activity', requireRole([Role.ADMIN]), recentActivity);

export default router;
