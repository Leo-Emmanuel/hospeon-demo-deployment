import { Request, Response, NextFunction } from 'express';
import { ZodError, ZodTypeAny, z } from 'zod';
import { AppError } from '../utils/app-error';

export const validateRequest = (schema: ZodTypeAny, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
        return next(new AppError(400, `Validation error: ${errors}`));
      }
      next(error);
    }
  };
};

export const idParamSchema = z.object({
  id: z.string().uuid(),
});

export const orderIdParamSchema = z.object({
  orderId: z.string().uuid(),
});

export const consultationIdParamSchema = z.object({
  consultationId: z.string().uuid(),
});
