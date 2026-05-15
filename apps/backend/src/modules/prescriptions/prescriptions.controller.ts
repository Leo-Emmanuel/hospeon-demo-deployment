import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';
import { prescriptionsService } from './prescriptions.service';

export const createPrescriptions = catchAsync(async (req: Request, res: Response) => successResponse(res, await prescriptionsService.bulkCreate(req.body, req.user?.userId, req.ip), 'Prescriptions created', 201));
export const getPrescriptions = catchAsync(async (req: Request, res: Response) => successResponse(res, await prescriptionsService.listByConsultation(req.params.consultationId), 'Prescriptions fetched'));
export const deactivatePrescription = catchAsync(async (req: Request, res: Response) => successResponse(res, await prescriptionsService.deactivate(req.params.id, req.user?.userId, req.ip), 'Prescription deactivated'));
