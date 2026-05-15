import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { getPagination, getPaginationMeta } from '../../utils/pagination';
import { writeAuditLog } from '../../utils/auditLog';
import { usersRepository } from './users.repository';
import { hashPassword } from '../../utils/password.util';

export class UsersService {
  private excludePassword<T extends { passwordHash: string }>(user: T): Omit<T, 'passwordHash'> {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  async list(query: any) {
    const { page, limit, skip, take } = getPagination(query);
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(query.role && { role: query.role }),
      ...(query.isActive !== undefined && { isActive: String(query.isActive) === 'true' }),
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      }),
    };

    const items = await usersRepository.findAll(where, skip, take);
    const total = await usersRepository.count(where);

    return {
      items: items.map(u => this.excludePassword(u)),
      meta: getPaginationMeta(page, limit, total),
    };
  }

  async getById(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) throw new AppError(404, 'User not found');
    return this.excludePassword(user);
  }

  async create(data: any, actorId?: string, ipAddress?: string) {
    const existing = await usersRepository.findByEmail(data.email);
    if (existing) throw new AppError(400, 'Email already in use');

    const passwordHash = await hashPassword(data.password);
    
    return prisma.$transaction(async (tx) => {
      const user = await usersRepository.create({
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
        departmentId: data.departmentId,
      }, tx);

      await writeAuditLog(tx, {
        actorId,
        action: 'CREATE',
        entityType: 'users',
        entityId: user.id,
        newValues: user,
        ipAddress,
      });

      return this.excludePassword(user);
    });
  }

  async update(id: string, data: any, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new AppError(404, 'User not found');

      if (data.email && data.email !== existing.email) {
        const emailInUse = await tx.user.findFirst({ where: { email: data.email, deletedAt: null } });
        if (emailInUse) throw new AppError(400, 'Email already in use');
      }

      const updateData: any = {
        name: data.name,
        email: data.email,
        role: data.role,
        departmentId: data.departmentId,
      };

      if (data.password) {
        updateData.passwordHash = await hashPassword(data.password);
      }

      const user = await usersRepository.update(id, updateData, tx);

      await writeAuditLog(tx, {
        actorId,
        action: 'UPDATE',
        entityType: 'users',
        entityId: user.id,
        oldValues: existing,
        newValues: user,
        ipAddress,
      });

      return this.excludePassword(user);
    });
  }

  async deactivate(id: string, actorId?: string, ipAddress?: string) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.user.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new AppError(404, 'User not found');

      const user = await usersRepository.update(id, { isActive: false }, tx);

      await writeAuditLog(tx, {
        actorId,
        action: 'DEACTIVATE',
        entityType: 'users',
        entityId: id,
        oldValues: existing,
        newValues: user,
        ipAddress,
      });

      return this.excludePassword(user);
    });
  }
}

export const usersService = new UsersService();
