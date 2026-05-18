import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { AppError } from '../utils/app-error';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        userCategory?: string;
      };
    }
  }
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const cookieToken = req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('accessToken='))
    ?.split('=')[1];

  if ((!authHeader || !authHeader.startsWith('Bearer ')) && !cookieToken) {
    return next(new AppError(401, 'Not authenticated'));
  }

  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : cookieToken;
  if (!token) {
    return next(new AppError(401, 'Not authenticated'));
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return next(new AppError(401, 'Token is invalid or expired'));
  }
};
