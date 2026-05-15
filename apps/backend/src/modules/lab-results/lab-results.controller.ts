import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';
import { labResultsService } from './lab-results.service';

export const enterLabResult = catchAsync(async (req: Request, res: Response) => successResponse(res, await labResultsService.enter(req.params.orderId, req.body, req.user?.userId, req.ip), 'Lab result entered', 201));
export const getLabResult = catchAsync(async (req: Request, res: Response) => successResponse(res, await labResultsService.get(req.params.orderId), 'Lab result fetched'));
export const updateLabResult = catchAsync(async (req: Request, res: Response) => successResponse(res, await labResultsService.update(req.params.orderId, req.body, req.user?.userId, req.ip), 'Lab result updated'));
export const approveLabResult = catchAsync(async (req: Request, res: Response) => successResponse(res, await labResultsService.approve(req.params.orderId, req.user?.userId, req.ip), 'Lab result approved'));
