import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';
import { dashboardService } from './dashboard.service';

export const dashboardSummary = catchAsync(async (req: Request, res: Response) => {
  const role = req.user?.role || 'STAFF';
  const userId = req.user?.userId || '';
  const requestedDay = req.query.day === 'yesterday' ? 'yesterday' : 'today';
  return successResponse(
    res,
    await dashboardService.getSummary(role, userId, requestedDay),
    'Dashboard summary fetched'
  );
});

export const opdQueue = catchAsync(async (_req: Request, res: Response) => {
  return successResponse(res, await dashboardService.getOpdQueue(), 'OPD queue fetched');
});

export const labQueue = catchAsync(async (_req: Request, res: Response) => {
  return successResponse(res, await dashboardService.getLabQueue(), 'Lab queue fetched');
});

export const doctorWorkload = catchAsync(async (_req: Request, res: Response) => {
  return successResponse(res, await dashboardService.getDoctorWorkload(), 'Doctor workload fetched');
});

export const recentActivity = catchAsync(async (_req: Request, res: Response) => {
  return successResponse(res, await dashboardService.getRecentActivity(), 'Recent activity fetched');
});

export const pharmacyWorklist = catchAsync(async (_req: Request, res: Response) => {
  return successResponse(res, await dashboardService.getPharmacyWorklist(), 'Pharmacy worklist fetched');
});
