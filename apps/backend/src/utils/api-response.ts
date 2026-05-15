import { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const successResponse = <T>(
  res: Response,
  data: T | null = null,
  message = 'Success',
  statusCode = 200,
  meta?: Record<string, unknown> | PaginationMeta
) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    ...(meta && { meta }),
  });
};

export const errorResponse = (message: string, details?: unknown) => {
  return {
    success: false,
    data: null,
    message,
    ...(details !== undefined ? { meta: { details } } : {}),
  };
};
