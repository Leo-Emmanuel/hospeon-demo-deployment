import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';
import { consultationsService } from './consultations.service';

export const createConsultation = catchAsync(async (req: Request, res: Response) => successResponse(res, await consultationsService.create(req.body, req.user?.userId, req.ip), 'Consultation created', 201));
export const getConsultation = catchAsync(async (req: Request, res: Response) => successResponse(res, await consultationsService.getById(req.params.id), 'Consultation fetched'));
export const updateConsultation = catchAsync(async (req: Request, res: Response) => successResponse(res, await consultationsService.update(req.params.id, req.body, req.user?.userId, req.ip), 'Consultation updated'));
export const completeConsultation = catchAsync(async (req: Request, res: Response) => successResponse(res, await consultationsService.complete(req.params.id, req.user?.userId, req.ip), 'Consultation completed'));
export const completeVisitHandler = catchAsync(async (req: Request, res: Response) => successResponse(res, await consultationsService.completeVisit(req.body, req.user?.userId, req.ip), 'Visit completed', 201));
