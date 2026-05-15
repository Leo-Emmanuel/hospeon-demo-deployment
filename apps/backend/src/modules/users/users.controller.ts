import { Request, Response } from 'express';
import { catchAsync } from '../../utils/catch-async';
import { successResponse } from '../../utils/api-response';
import { usersService } from './users.service';

export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await usersService.list(req.query);
  return successResponse(res, result.items, 'Users fetched', 200, result.meta);
});

export const createUser = catchAsync(async (req: Request, res: Response) => {
  const user = await usersService.create(req.body, req.user?.userId, req.ip);
  return successResponse(res, user, 'User created', 201);
});

export const getUser = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, await usersService.getById(req.params.id), 'User fetched');
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, await usersService.update(req.params.id, req.body, req.user?.userId, req.ip), 'User updated');
});

export const deactivateUser = catchAsync(async (req: Request, res: Response) => {
  return successResponse(res, await usersService.deactivate(req.params.id, req.user?.userId, req.ip), 'User deactivated');
});

export const listDoctors = catchAsync(async (req: Request, res: Response) => {
  const result = await usersService.list({ ...req.query, role: 'DOCTOR', limit: 100 });
  return successResponse(res, result.items, 'Doctors fetched', 200, result.meta);
});
