import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/app-error';
import { Role, UserCategory } from '@hospeon/shared';

export const requireRole = (allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated'));
    }

    const userRole = String(req.user.role).toUpperCase();
    const userCategory = String(req.user.userCategory || '').toUpperCase();
    if (userCategory && userCategory !== UserCategory.INTERNAL_STAFF) {
      return next(new AppError(403, 'You do not have permission to perform this action'));
    }
    const upperAllowed = allowedRoles.map((r) => String(r).toUpperCase());

    if (!upperAllowed.includes(userRole)) {
      return next(new AppError(403, 'You do not have permission to perform this action'));
    }

    next();
  };
};

export const requireUserCategory = (allowedCategories: UserCategory[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Not authenticated'));
    }
    const category = String(req.user.userCategory || '').toUpperCase();
    const upperAllowed = allowedCategories.map((c) => String(c).toUpperCase());
    if (!upperAllowed.includes(category)) {
      return next(new AppError(403, 'You do not have permission to perform this action'));
    }
    next();
  };
};
