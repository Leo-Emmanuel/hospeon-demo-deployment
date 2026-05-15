import { Router } from 'express';
import { Role } from '@hospeon/shared';
import { requireAuth } from '../../middlewares/auth.middleware';
import { requireRole } from '../../middlewares/rbac.middleware';
import { idParamSchema, validateRequest } from '../../middlewares/validate.middleware';
import { createPatientSchema, patientQuerySchema, updatePatientSchema } from './patients.validation';
import {
  createPatient,
  deletePatient,
  getPatient,
  getPatientConsultations,
  getPatientLabOrders,
  getPatientPrescriptions,
  getPatientVisits,
  listPatients,
  updatePatient,
} from './patients.controller';

const router = Router();
const patientReaders = [Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.RECEPTIONIST];

router.use(requireAuth);
router.get('/', requireRole(patientReaders), validateRequest(patientQuerySchema, 'query'), listPatients);
router.post('/', requireRole([Role.ADMIN, Role.RECEPTIONIST]), validateRequest(createPatientSchema), createPatient);
router.get('/:id', requireRole(patientReaders), validateRequest(idParamSchema, 'params'), getPatient);
router.put('/:id', requireRole(patientReaders), validateRequest(idParamSchema, 'params'), validateRequest(updatePatientSchema), updatePatient);
router.delete('/:id', requireRole([Role.ADMIN]), validateRequest(idParamSchema, 'params'), deletePatient);
router.get('/:id/visits', requireRole(patientReaders), validateRequest(idParamSchema, 'params'), getPatientVisits);
router.get('/:id/consultations', requireRole(patientReaders), validateRequest(idParamSchema, 'params'), getPatientConsultations);
router.get('/:id/lab-orders', requireRole(patientReaders), validateRequest(idParamSchema, 'params'), getPatientLabOrders);
router.get('/:id/prescriptions', requireRole(patientReaders), validateRequest(idParamSchema, 'params'), getPatientPrescriptions);

export default router;
