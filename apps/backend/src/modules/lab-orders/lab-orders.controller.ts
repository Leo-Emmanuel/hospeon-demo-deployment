import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';
import { labOrdersService } from './lab-orders.service';

export const listLabOrders = catchAsync(async (req: Request, res: Response) => {
  const result = await labOrdersService.list(req.query);
  return successResponse(res, result.items, 'Lab orders fetched', 200, result.meta);
});
export const createLabOrder = catchAsync(async (req: Request, res: Response) => successResponse(res, await labOrdersService.create(req.body, req.user?.userId, req.ip), 'Lab order created', 201));
export const getLabOrder = catchAsync(async (req: Request, res: Response) => successResponse(res, await labOrdersService.getById(req.params.id), 'Lab order fetched'));
export const updateLabOrderStatus = catchAsync(async (req: Request, res: Response) => successResponse(res, await labOrdersService.updateStatus(req.params.id, req.body.status, req.user?.role, req.user?.userId, req.ip), 'Lab order status updated'));
export const cancelLabOrder = catchAsync(async (req: Request, res: Response) => successResponse(res, await labOrdersService.cancel(req.params.id, req.user?.role, req.user?.userId, req.ip), 'Lab order cancelled'));
