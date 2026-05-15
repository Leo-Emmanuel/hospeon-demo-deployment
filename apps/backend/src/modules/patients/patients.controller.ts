import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';
import { patientsService } from './patients.service';

export const listPatients = catchAsync(async (req: Request, res: Response) => {
  const result = await patientsService.list(req.query);
  return successResponse(res, result.items, 'Patients fetched', 200, result.meta);
});

export const createPatient = catchAsync(async (req: Request, res: Response) => {
  const patient = await patientsService.create(req.body, req.user?.userId, req.ip);
  return successResponse(res, patient, 'Patient registered', 201);
});

export const getPatient = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, await patientsService.getById(req.params.id), 'Patient fetched');
});

export const updatePatient = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, await patientsService.update(req.params.id, req.body, req.user?.userId, req.ip), 'Patient updated');
});

export const deletePatient = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, await patientsService.softDelete(req.params.id, req.user?.userId, req.ip), 'Patient deleted');
});

export const getPatientVisits = catchAsync(async (req: Request, res: Response) => successResponse(res, await patientsService.visits(req.params.id), 'Patient visits fetched'));
export const getPatientConsultations = catchAsync(async (req: Request, res: Response) => successResponse(res, await patientsService.consultations(req.params.id), 'Patient consultations fetched'));
export const getPatientLabOrders = catchAsync(async (req: Request, res: Response) => successResponse(res, await patientsService.labOrders(req.params.id), 'Patient lab orders fetched'));
export const getPatientPrescriptions = catchAsync(async (req: Request, res: Response) => successResponse(res, await patientsService.prescriptions(req.params.id), 'Patient prescriptions fetched'));
