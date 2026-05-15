import { Request, Response } from 'express';
import { authService } from './auth.service';
import { successResponse } from '../../utils/api-response';
import { catchAsync } from '../../utils/catch-async';
import { RegisterDto, LoginDto } from '@hospeon/shared';
import { AppError } from '../../utils/app-error';

const cookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? ('none' as const) : ('lax' as const),
  };
};

const getCookieValue = (req: Request, name: string) =>
  req.headers.cookie
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`))
    ?.split('=')[1];

const setAuthCookies = (res: Response, result: any) => {
  const options = cookieOptions();
  res.cookie('refreshToken', result.refreshToken, {
    ...options,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.cookie('accessToken', result.accessToken, {
    ...options,
    maxAge: 15 * 60 * 1000,
  });
  const { refreshToken, ...clientResult } = result;
  return clientResult;
};

export const register = catchAsync(async (req: Request, res: Response) => {
  const data: RegisterDto = req.body;
  const result = await authService.register(data);
  return successResponse(res, setAuthCookies(res, result), 'Registration successful', 201);
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const data: LoginDto = req.body;
  const result = await authService.login(data);
  return successResponse(res, setAuthCookies(res, result), 'Login successful', 200);
});

export const getMe = catchAsync(async (req: Request, res: Response) => {
  // req.user is set by the auth middleware
  const userId = req.user!.userId;
  const user = await authService.getCurrentUser(userId);
  return successResponse(res, user, 'Current user fetched');
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const options = cookieOptions();
  res.clearCookie('accessToken', options);
  res.clearCookie('refreshToken', options);
  return successResponse(res, null, 'Logged out successfully');
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = getCookieValue(req, 'refreshToken');

  if (!refreshToken) {
    throw new AppError(401, 'No refresh token present');
  }

  const result = await authService.refreshSession(refreshToken);
  return successResponse(res, setAuthCookies(res, result), 'Session refreshed');
});
