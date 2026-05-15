import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';
import { visitsService } from './visits.service';

export const createVisit = catchAsync(async (req: Request, res: Response) => successResponse(res, await visitsService.create(req.body, req.user?.userId, req.ip), 'Visit created', 201));
export const listVisits = catchAsync(async (req: Request, res: Response) => {
  const result = await visitsService.list(req.query, req.user);
  return successResponse(res, result.items, 'Visits fetched', 200, result.meta);
});
export const getVisit = catchAsync(async (req: Request, res: Response) => successResponse(res, await visitsService.getById(req.params.id), 'Visit fetched'));
export const updateVisit = catchAsync(async (req: Request, res: Response) => successResponse(res, await visitsService.update(req.params.id, req.body, req.user?.userId, req.ip), 'Visit updated'));
export const updateVisitStatus = catchAsync(async (req: Request, res: Response) => successResponse(res, await visitsService.updateStatus(req.params.id, req.body.status, req.user?.userId, req.ip), 'Visit status updated'));
