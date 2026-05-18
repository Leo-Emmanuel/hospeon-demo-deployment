import { authRepository } from './auth.repository';
import { RegisterDto, LoginDto, AuthResponseDto, Role, UserCategory } from '@hospeon/shared';
import { AppError } from '../../utils/app-error';
import { hashPassword, comparePassword } from '../../utils/password.util';
import { generateRefreshToken, generateToken, verifyRefreshToken } from '../../utils/jwt.util';

export class AuthService {
  private toAuthUser(user: { id: string; name: string; email: string; role: string; userCategory: string }) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as Role,
      userCategory: user.userCategory as UserCategory,
    };
  }

  async register(data: RegisterDto): Promise<AuthResponseDto> {
    const existingUser = await authRepository.findUserByEmail(data.email);
    if (existingUser) {
      throw new AppError(400, 'User with this email already exists');
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await authRepository.createUser({
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: Role.PATIENT,
      userCategory: UserCategory.PATIENT,
      passwordHash: hashedPassword,
    });

    const accessToken = generateToken({ userId: user.id, role: user.role, userCategory: user.userCategory });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role, userCategory: user.userCategory });

    return {
      user: this.toAuthUser(user),
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginDto): Promise<AuthResponseDto> {
    const user = await authRepository.findUserByEmail(data.email);
    if (!user) {
      throw new AppError(401, 'Invalid email or password');
    }

    const isPasswordValid = await comparePassword(data.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid email or password');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Account has been deactivated');
    }

    const accessToken = generateToken({ userId: user.id, role: user.role, userCategory: user.userCategory });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role, userCategory: user.userCategory });

    return {
      user: this.toAuthUser(user),
      accessToken,
      refreshToken,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      userCategory: user.userCategory,
    };
  }

  async refreshSession(refreshToken: string): Promise<AuthResponseDto> {
    let payload: { userId: string; role: string };

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      throw new AppError(401, 'Refresh token is invalid or expired');
    }

    const user = await authRepository.findUserById(payload.userId);
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!user.isActive) {
      throw new AppError(403, 'Account has been deactivated');
    }

    const nextAccessToken = generateToken({ userId: user.id, role: user.role, userCategory: user.userCategory });
    const nextRefreshToken = generateRefreshToken({ userId: user.id, role: user.role, userCategory: user.userCategory });

    return {
      user: this.toAuthUser(user),
      accessToken: nextAccessToken,
      refreshToken: nextRefreshToken,
    };
  }
}

export const authService = new AuthService();
